/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  ListChecks,
  Plus,
  Trash2,
  CheckCircle,
  HelpCircle,
  X,
  FileText,
  Bookmark,
  Sparkles,
  Cpu
} from "lucide-react";
import { Question, ExamPackage } from "../types";

const TEMPLATE_SOAL = [
  {
    category: "Try Out: Kesebangunan & Skala 📐",
    icon: "📐",
    color: "from-cyan-400 to-indigo-600",
    questions: [
      {
        questionText: "Sebuah foto berukuran 4 cm x 6 cm akan dicetak dalam ukuran besar. Lebar foto tersebut diperbesar menjadi 12 cm. Berapakah tinggi foto setelah diperbesar?",
        options: [
          { key: "A", text: "8 cm" },
          { key: "B", text: "12 cm" },
          { key: "C", text: "18 cm" },
          { key: "D", text: "24 cm" },
          { key: "E", text: "30 cm" }
        ],
        correctAnswer: "C",
        explanation: "Penyelesaian: Soal ini berkaitan dengan konsep kesebangunan. Jika lebar diperbesar 3 kali (dari 4 cm menjadi 12 cm), maka tinggi juga akan diperbesar 3 kali. Tinggi baru = 6 cm * 3 = 18 cm."
      },
      {
        questionText: "Dua buah segitiga siku-siku sebangun. Jika panjang sisi-sisi segitiga pertama adalah 3 cm, 4 cm, dan 5 cm, serta sisi terpendek segitiga kedua adalah 6 cm, berapakah panjang sisi terpanjang segitiga kedua?",
        options: [
          { key: "A", text: "8 cm" },
          { key: "B", text: "9 cm" },
          { key: "C", text: "10 cm" },
          { key: "D", text: "15 cm" },
          { key: "E", text: "18 cm" }
        ],
        correctAnswer: "C",
        explanation: "Penyelesaian: Karena kedua segitiga sebangun, perbandingan sisi-sisinya sama. Sisi terpendek segitiga pertama adalah 3 cm dan sisi terpanjang adalah 5 cm. Sisi terpendek segitiga kedua adalah 6 cm. Perbandingannya adalah 6/3 = 2. Maka, sisi terpanjang segitiga kedua adalah 5 cm * 2 = 10 cm."
      },
      {
        questionText: "Sebuah bayangan pohon tingginya 8 meter. Pada saat yang sama, bayangan tiang bendera yang tingginya 12 meter adalah 6 meter. Berapakah tinggi pohon sebenarnya?",
        options: [
          { key: "A", text: "4 meter" },
          { key: "B", text: "10 meter" },
          { key: "C", text: "12 meter" },
          { key: "D", text: "16 meter" },
          { key: "E", text: "20 meter" }
        ],
        correctAnswer: "D",
        explanation: "Penyelesaian: Ini adalah aplikasi kesebangunan dalam soal cerita. Perbandingan tinggi dengan bayangan pada objek yang sama akan sebangun. Misalkan tinggi pohon sebenarnya adalah T, maka T/8 = 12/6. T = (12/6) * 8 = 2 * 8 = 16 meter."
      },
      {
        questionText: "Sebuah peta memiliki skala 1:1.000.000. Jika jarak antara dua kota pada peta adalah 5 cm, berapakah jarak sebenarnya kedua kota tersebut dalam kilometer?",
        options: [
          { key: "A", text: "5 km" },
          { key: "B", text: "50 km" },
          { key: "C", text: "500 km" },
          { key: "D", text: "5000 km" },
          { key: "E", text: "250 km" }
        ],
        correctAnswer: "B",
        explanation: "Penyelesaian: Skala 1:1.000.000 berarti 1 cm pada peta mewakili 1.000.000 cm jarak sebenarnya. Jarak sebenarnya = 5 cm * 1.000.000 = 5.000.000 cm. Untuk mengubah ke kilometer, bagi dengan 100.000 (karena 1 km = 100.000 cm). Jarak sebenarnya = 5.000.000 cm / 100.000 = 50 km."
      },
      {
        questionText: "Dalam sebuah foto, tinggi seorang anak adalah 3 cm dan lebar foto tersebut adalah 4 cm. Jika tinggi anak sebenarnya adalah 150 cm, berapakah lebar foto yang sebenarnya jika foto dan anak tersebut sebangun?",
        options: [
          { key: "A", text: "100 cm" },
          { key: "B", text: "150 cm" },
          { key: "C", text: "180 cm" },
          { key: "D", text: "200 cm" },
          { key: "E", text: "250 cm" }
        ],
        correctAnswer: "D",
        explanation: "Penyelesaian: Diketahui tinggi anak pada foto (3 cm) sebangun dengan tinggi anak sebenarnya (150 cm). Lebar foto (4 cm) sebangun dengan lebar sebenarnya (L). Perbandingannya adalah tinggi foto/tinggi sebenarnya = lebar foto/lebar sebenarnya. 3/150 = 4/L. L = (4 * 150) / 3 = 600 / 3 = 200 cm."
      }
    ]
  },
  {
    category: "Try Out: Barisan Aritmatika 🔢",
    icon: "🔢",
    color: "from-teal-400 to-emerald-600",
    questions: [
      {
        questionText: "Dalam sebuah barisan aritmatika, suku pertama adalah 7 dan beda barisan adalah 3. Berapakah suku ke-10 dari barisan tersebut?",
        options: [
          { key: "A", text: "30" },
          { key: "B", text: "31" },
          { key: "C", text: "34" },
          { key: "D", text: "37" },
          { key: "E", text: "40" }
        ],
        correctAnswer: "C",
        explanation: "Penyelesaian: Rumus suku ke-n barisan aritmatika adalah Un = a + (n-1)b, di mana a adalah suku pertama dan b adalah beda. Diketahui a = 7, b = 3, dan n = 10. Maka, U10 = 7 + (10-1) * 3 = 7 + 9 * 3 = 7 + 27 = 34."
      },
      {
        questionText: "Jumlah 15 suku pertama dari sebuah barisan aritmatika adalah 450. Jika suku pertama adalah 10, berapakah beda barisan tersebut?",
        options: [
          { key: "A", text: "2" },
          { key: "B", text: "3" },
          { key: "C", text: "4" },
          { key: "D", text: "20/7" },
          { key: "E", text: "5" }
        ],
        correctAnswer: "D",
        explanation: "Penyelesaian: Rumus jumlah n suku pertama barisan aritmatika adalah Sn = n/2 * (2a + (n-1)b). Diketahui S15 = 450, n = 15, dan a = 10. Maka, 450 = 15/2 * (2*10 + (15-1)b). 450 = 7.5 * (20 + 14b). 450 / 7.5 = 20 + 14b. 60 = 20 + 14b. 40 = 14b. b = 40/14 = 20/7."
      },
      {
        questionText: "Diketahui sebuah barisan aritmatika: 3, 8, 13, 18, ... Berapakah jumlah 20 suku pertama dari barisan ini?",
        options: [
          { key: "A", text: "950" },
          { key: "B", text: "1000" },
          { key: "C", text: "1010" },
          { key: "D", text: "1050" },
          { key: "E", text: "1100" }
        ],
        correctAnswer: "C",
        explanation: "Penyelesaian: Suku pertama (a) = 3. Beda (b) = 8 - 3 = 5. Jumlah 20 suku pertama (S20) dicari dengan rumus Sn = n/2 * (2a + (n-1)b). S20 = 20/2 * (2*3 + (20-1)*5) = 10 * (6 + 19*5) = 10 * (6 + 95) = 10 * 101 = 1010."
      },
      {
        questionText: "Suku terakhir dari suatu barisan aritmatika adalah 50. Jika suku pertama adalah 5 dan bedanya adalah 5, berapakah jumlah suku dalam barisan tersebut?",
        options: [
          { key: "A", text: "250" },
          { key: "B", text: "275" },
          { key: "C", text: "300" },
          { key: "D", text: "325" },
          { key: "E", text: "350" }
        ],
        correctAnswer: "B",
        explanation: "Penyelesaian: Kita perlu mencari n terlebih dahulu. Rumus Un = a + (n-1)b. Diketahui Un = 50, a = 5, b = 5. Maka, 50 = 5 + (n-1)5. 45 = (n-1)5. 9 = n-1. n = 10. Sekarang cari jumlah suku pertama (S10) menggunakan rumus Sn = n/2 * (a + Un). S10 = 10/2 * (5 + 50) = 5 * 55 = 275."
      },
      {
        questionText: "Dalam sebuah pertunjukan seni, jumlah penonton pada baris pertama adalah 15 orang. Setiap baris berikutnya memiliki jumlah penonton 2 orang lebih banyak dari baris sebelumnya. Jika ada 10 baris kursi, berapakah total penonton yang dapat ditampung?",
        options: [
          { key: "A", text: "210" },
          { key: "B", text: "240" },
          { key: "C", text: "250" },
          { key: "D", text: "270" },
          { key: "E", text: "290" }
        ],
        correctAnswer: "B",
        explanation: "Penyelesaian: Ini adalah masalah barisan aritmatika. Suku pertama (a) = 15, beda (b) = 2, dan jumlah baris (n) = 10. Kita perlu mencari jumlah 10 suku pertama (S10) menggunakan rumus Sn = n/2 * (2a + (n-1)b). S10 = 10/2 * (2*15 + (10-1)*2) = 5 * (30 + 9*2) = 5 * (30 + 18) = 5 * 48 = 240."
      }
    ]
  }
];

interface QuestionsViewProps {
  questions: Question[];
  packages: ExamPackage[];
  onAddQuestion: (q: Question) => void;
  onDeleteQuestion: (id: string) => void;
}

export default function QuestionsView({
  questions,
  packages,
  onAddQuestion,
  onDeleteQuestion
}: QuestionsViewProps) {
  const [selectedPkgId, setSelectedPkgId] = useState<string>(packages[0]?.id || "");
  const [isAdding, setIsAdding] = useState(false);
  const [addMode, setAddMode] = useState<"ai" | "manual">("ai");

  // States for AI Question Generator Co-Pilot
  const [jenjang, setJenjang] = useState("");
  const [fase, setFase] = useState("");
  const [kelas, setKelas] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [bentukSoal, setBentukSoal] = useState<string>("Pilihan Ganda");
  const [jumlahOpsi, setJumlahOpsi] = useState<"ABC" | "ABCD">("ABCD");
  const [tambahGambar, setTambahGambar] = useState<boolean>(false);
  const [activeDifficulties, setActiveDifficulties] = useState<Record<string, boolean>>({
    Mudah: true,
    Sedang: true,
    Sulit: true
  });
  const [difficultyCounts, setDifficultyCounts] = useState<Record<string, number>>({
    Mudah: 1,
    Sedang: 1,
    Sulit: 1
  });
  const [dimensiKognitif, setDimensiKognitif] = useState<string[]>(["C1", "C2", "C3", "C4", "C5", "C6"]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSource, setGenerationSource] = useState<"gemini" | "fallback" | null>(null);

  // Calculate total questions expected
  const totalSoal = Object.keys(activeDifficulties).reduce((sum, lvl) => {
    return sum + (activeDifficulties[lvl] ? (difficultyCounts[lvl] || 0) : 0);
  }, 0);

  const handleGenerateAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPkgId) {
      alert("Harap pilih paket ujian terlebih dahulu untuk menampung butir soal hasil generasi!");
      return;
    }
    if (!subject.trim()) {
      alert("Harap masukkan nama Mata Pelajaran!");
      return;
    }
    if (!topic.trim()) {
      alert("Harap masukkan deskripsi Topik / Lingkup Materi!");
      return;
    }
    if (totalSoal <= 0) {
      alert("Harap pilih minimal satu tingkat kesulitan dengan jumlah soal lebih dari 0!");
      return;
    }

    setIsGenerating(true);
    setGenerationSource(null);

    try {
      const res = await fetch("/api/gemini/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jenjang,
          fase,
          kelas,
          subject,
          topic,
          bentukSoal,
          tambahGambar,
          activeDifficulties: Object.keys(activeDifficulties).filter(lvl => activeDifficulties[lvl]),
          difficultyCounts,
          dimensiKognitif,
          totalSoal,
          jumlahOpsi: bentukSoal === "Pilihan Ganda" ? jumlahOpsi : "ABCD"
        })
      });

      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        data.questions.forEach((q: any, index: number) => {
          onAddQuestion({
            id: `q-ai-${Date.now()}-${index}-${Math.floor(Math.random() * 1000)}`,
            packageId: selectedPkgId,
            questionText: q.questionText,
            options: q.options.map((opt: any) => ({
              key: opt.key as "A" | "B" | "C" | "D" | "E",
              text: opt.text
            })),
            correctAnswer: q.correctAnswer as any,
            explanation: q.explanation
          });
        });

        if (data.source === "gemini-ai") {
          setGenerationSource("gemini");
          alert(`Sukses! ${data.questions.length} butir soal tingkat tinggi berhasil digenerasikan oleh Gemini AI.`);
        } else {
          setGenerationSource("fallback");
          alert(`Info: ${data.message || "Pembuatan butir soal berhasil disesuaikan secara instan menggunakan standard template fallback."}`);
        }

        // Keep active inputs, or just clear topic so user can type more easily
        setTopic("");
      } else {
        throw new Error(data.message || "Backend mengembalikan struktur data kosong.");
      }
    } catch (error: any) {
      console.error(error);
      alert(`Terjadi kesalahan pengerjaan AI: ${error.message || "Koneksi terputus."}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImportTemplate = (tpl: typeof TEMPLATE_SOAL[0]) => {
    if (!selectedPkgId) {
      alert("Harap pilih paket ujian terlebih dahulu!");
      return;
    }
    
    tpl.questions.forEach((q, index) => {
      onAddQuestion({
        id: `q-tpl-${Date.now()}-${index}-${Math.floor(Math.random() * 1000)}`,
        packageId: selectedPkgId,
        questionText: q.questionText,
        options: q.options.map(opt => ({
          key: opt.key as "A" | "B" | "C" | "D" | "E",
          text: opt.text
        })),
        correctAnswer: q.correctAnswer as any,
        explanation: q.explanation
      });
    });
    
    alert(`Sukses mengimpor ${tpl.questions.length} butir template soal ke dalam paket ujian!`);
  };

  // Form states for new questions
  const [questionText, setQuestionText] = useState("");
  const [manualJumlahOpsi, setManualJumlahOpsi] = useState<"ABC" | "ABCD">("ABCD");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState<"A" | "B" | "C" | "D">("A");
  const [explanation, setExplanation] = useState("");

  const handleManualJumlahOpsiChange = (val: "ABC" | "ABCD") => {
    setManualJumlahOpsi(val);
    if (val === "ABC" && correctAnswer === "D") {
      setCorrectAnswer("A");
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim() || !optionA.trim() || !optionB.trim()) {
      alert("Soal dan minimal opsi A & B wajib diisi!");
      return;
    }

    if (manualJumlahOpsi === "ABC" && !optionC.trim()) {
      alert("Opsi C wajib diisi untuk pilihan 3 opsi!");
      return;
    }
    if (manualJumlahOpsi === "ABCD" && (!optionC.trim() || !optionD.trim())) {
      alert("Opsi C dan D wajib diisi untuk pilihan 4 opsi!");
      return;
    }

    const finalOptions = [
      { key: "A", text: optionA },
      { key: "B", text: optionB }
    ];

    if (manualJumlahOpsi === "ABC") {
      finalOptions.push({ key: "C", text: optionC });
    } else if (manualJumlahOpsi === "ABCD") {
      finalOptions.push({ key: "C", text: optionC });
      finalOptions.push({ key: "D", text: optionD });
    }

    let finalCorrectAnswer = correctAnswer;
    if (manualJumlahOpsi === "ABC" && correctAnswer === "D") {
      finalCorrectAnswer = "A";
    }

    onAddQuestion({
      id: `q-${Date.now()}`,
      packageId: selectedPkgId,
      questionText,
      options: finalOptions as any[],
      correctAnswer: finalCorrectAnswer,
      explanation
    });

    // Reset fields
    setQuestionText("");
    setOptionA("");
    setOptionB("");
    setOptionC("");
    setOptionD("");
    setCorrectAnswer("A");
    setExplanation("");
    setIsAdding(false);
  };

  const filteredQuestions = questions.filter((q) => q.packageId === selectedPkgId);
  const activePackage = packages.find((p) => p.id === selectedPkgId);

  return (
    <div className="space-y-6">
      {/* Top Banner with package selector */}
      <div className="bg-white p-5 rounded-xl border border-slate-150 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-800 font-heading">Data Paket & Bank Soal CBT</h2>
          <p className="text-xs text-slate-500 font-sans">
            Lihat daftar butir soal, buat butir pilihan ganda baru, kelola opsi jawaban, dan sertakan pembahasan latihan.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-500 shrink-0 uppercase tracking-wider">Pilih Paket:</span>
          <select
            value={selectedPkgId}
            onChange={(e) => {
              setSelectedPkgId(e.target.value);
              setIsAdding(false);
            }}
            className="w-full md:w-64 text-xs border border-slate-200 p-2.5 rounded-lg outline-none bg-slate-50 font-medium text-slate-800"
          >
            {packages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main body area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Adding question form or Package Details info */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-150 shadow-2xs space-y-4">
            <h3 className="font-bold text-slate-800 text-sm pb-2 border-b border-slate-100 flex items-center gap-1.5">
              <Bookmark size={15} className="text-red-650 text-rose-600" />
              Paket Terpilih Detail
            </h3>

            {activePackage && (
              <div className="space-y-3.5 text-xs text-slate-600">
                <div className="space-y-0.5">
                  <div className="text-[10px] text-slate-400 font-bold uppercase block">Nama Paket</div>
                  <div className="font-bold text-slate-800 text-sm leading-tight">{activePackage.name}</div>
                </div>

                <div className="font-mono">
                  <div className="border border-slate-100 p-2.5 rounded bg-slate-50/50">
                    <span className="text-[9px] text-slate-400 uppercase block font-sans">Total Soal</span>
                    <span className="font-bold text-slate-800">{activePackage.totalQuestions} Butir</span>
                  </div>
                </div>

                <p className="text-slate-500 italic text-[11px] leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  "{activePackage.description || "Tidak ada rincian spesifikasi tambahan."}"
                </p>
              </div>
            )}

            {!isAdding && (
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-xs transition"
              >
                <Plus size={15} /> Buat Butir Soal Baru
              </button>
            )}
          </div>
        </div>

        {/* Right Side: List of Questions or Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Form to add new multiple choice button */}
          {isAdding ? (
            <div className="space-y-4">
              {/* Tab Selector inside Card or Header */}
              <div className="bg-white p-3 rounded-2xl border border-slate-150 shadow-3xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
                <div className="space-y-0.5">
                  <h3 className="font-bold text-slate-850 text-sm flex items-center gap-1.5">
                    {addMode === "ai" ? (
                      <>
                        <Sparkles size={16} className="text-emerald-500 animate-pulse" />
                        Sistem Generator Soal AI
                      </>
                    ) : (
                      <>
                        <ListChecks size={16} className="text-rose-600" />
                        Form Butir Soal Pilihan Ganda Baru
                      </>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-450 leading-relaxed">
                    {addMode === "ai"
                      ? "Hasilkan soal instan berbasis kecerdasan AI sesuai tingkat kelas & indikator mapel pilihan Anda."
                      : "Buat butir pertanyaan CBT secara manual dengan opsi pilihan ganda dan kunci jawaban."}
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 p-1 rounded-xl shrink-0 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setAddMode("ai")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                      addMode === "ai"
                        ? "bg-emerald-600 text-white shadow-3xs"
                        : "text-slate-500 hover:text-slate-850"
                    }`}
                  >
                    <Sparkles size={13} /> Generasi AI
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddMode("manual")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                      addMode === "manual"
                        ? "bg-red-600 text-white shadow-3xs"
                        : "text-slate-500 hover:text-slate-850"
                    }`}
                  >
                    <ListChecks size={13} /> Input Manual
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="p-1.5 hover:bg-slate-200 text-slate-450 hover:text-slate-700 rounded-lg cursor-pointer ml-1"
                    title="Batal"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {addMode === "ai" ? (
                /* AI Generation Form Block */
                <form onSubmit={handleGenerateAI} className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-3xs space-y-5 animate-fadeIn">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Green layout container matching screenshot exactly */}
                    <div className="bg-emerald-50/25 border border-emerald-100 p-4 rounded-xl md:col-span-3 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Jenjang */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-600 block uppercase tracking-wider">1. Jenjang Pendidikan</label>
                          <select
                            value={jenjang}
                            onChange={(e) => setJenjang(e.target.value)}
                            className="w-full text-xs border border-slate-200 p-2.5 rounded-xl bg-white text-slate-700 outline-none focus:border-emerald-500 font-sans cursor-pointer"
                          >
                            <option value="">-- Pilih Jenjang --</option>
                            <option value="SD/MI">SD/MI</option>
                            <option value="SMP/MTs">SMP/MTs</option>
                            <option value="SMA/MA">SMA/MA</option>
                            <option value="SMK">SMK</option>
                          </select>
                        </div>

                        {/* Fase */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-600 block uppercase tracking-wider">2. Fase Pembelajaran</label>
                          <select
                            value={fase}
                            onChange={(e) => setFase(e.target.value)}
                            className="w-full text-xs border border-slate-200 p-2.5 rounded-xl bg-white text-slate-700 outline-none focus:border-emerald-500 font-sans cursor-pointer"
                          >
                            <option value="">-- Pilih Fase --</option>
                            <option value="Fase A (Kelas 1-2)">Fase A (Kelas 1-2)</option>
                            <option value="Fase B (Kelas 3-4)">Fase B (Kelas 3-4)</option>
                            <option value="Fase C (Kelas 5-6)">Fase C (Kelas 5-6)</option>
                            <option value="Fase D (Kelas 7-9)">Fase D (Kelas 7-9)</option>
                            <option value="Fase E (Kelas 10)">Fase E (Kelas 10)</option>
                            <option value="Fase F (Kelas 11-12)">Fase F (Kelas 11-12)</option>
                          </select>
                        </div>

                        {/* Kelas */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-600 block uppercase tracking-wider">3. Kelas</label>
                          <select
                            value={kelas}
                            onChange={(e) => setKelas(e.target.value)}
                            className="w-full text-xs border border-slate-200 p-2.5 rounded-xl bg-white text-slate-700 outline-none focus:border-emerald-500 font-sans cursor-pointer"
                          >
                            <option value="">-- Pilih Kelas --</option>
                            <option value="Kelas 1">Kelas 1</option>
                            <option value="Kelas 2">Kelas 2</option>
                            <option value="Kelas 3">Kelas 3</option>
                            <option value="Kelas 4">Kelas 4</option>
                            <option value="Kelas 5">Kelas 5</option>
                            <option value="Kelas 6">Kelas 6</option>
                            <option value="Kelas 7">Kelas 7</option>
                            <option value="Kelas 8">Kelas 8</option>
                            <option value="Kelas 9">Kelas 9</option>
                            <option value="Kelas 10">Kelas 10</option>
                            <option value="Kelas 11">Kelas 11</option>
                            <option value="Kelas 12">Kelas 12</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Subject Input */}
                    <div className="space-y-1 md:col-span-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-heading">MATA PELAJARAN</label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Contoh: Matematika Wajib"
                        required
                        className="w-full text-xs border border-slate-200 p-2.5 rounded-xl bg-slate-50 outline-none focus:ring-1 focus:ring-emerald-400 focus:border-emerald-500 font-sans"
                      />
                    </div>

                    {/* Topic Input */}
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-heading">TOPIK / LINGKUP MATERI</label>
                      <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Deskripsikan cakupan materi secara spesifik..."
                        required
                        className="w-full text-xs border border-slate-200 p-2.5 rounded-xl bg-slate-50 outline-none focus:ring-1 focus:ring-emerald-400 focus:border-emerald-500 font-sans"
                      />
                    </div>
                  </div>

                  {/* INPUT BAGIAN SOAL SECTION */}
                  <div className="border-t border-slate-100 pt-4 space-y-4">
                    <div className="bg-emerald-550/15 text-emerald-800 px-3 py-1.5 rounded-lg text-xs font-bold font-heading flex items-center gap-1.5 w-max">
                      <Plus size={13} className="stroke-[3]" />
                      INPUT BAGIAN SOAL
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* BENTUK SOAL */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-heading">
                          BENTUK SOAL
                        </label>
                        <select
                          value={bentukSoal}
                          onChange={(e) => setBentukSoal(e.target.value)}
                          className="w-full text-xs border border-slate-200 p-2.5 rounded-xl bg-white outline-none focus:border-emerald-500 font-sans cursor-pointer"
                        >
                          <option value="Pilihan Ganda">Pilihan Ganda</option>
                          <option value="Pilihan Ganda Kompleks">Pilihan Ganda Kompleks</option>
                          <option value="Menjodohkan">Menjodohkan</option>
                          <option value="Isian Singkat">Isian Singkat</option>
                          <option value="Uraian / Esai">Uraian / Esai</option>
                        </select>
                      </div>

                      {/* JUMLAH OPSI (Hanya untuk Pilihan Ganda) */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-heading">
                          JUMLAH OPSI
                        </label>
                        {bentukSoal === "Pilihan Ganda" ? (
                          <div className="grid grid-cols-2 gap-1 border border-slate-200 rounded-xl bg-slate-50 p-1">
                            {(["ABC", "ABCD"] as const).map((opsi) => {
                              const isActive = jumlahOpsi === opsi;
                              return (
                                <button
                                  type="button"
                                  key={opsi}
                                  onClick={() => setJumlahOpsi(opsi)}
                                  className={`py-1.5 px-3 text-xs font-bold transition-all text-center rounded-lg cursor-pointer ${
                                    isActive
                                      ? "bg-emerald-600 text-white font-black shadow-3xs"
                                      : "bg-transparent text-slate-500 hover:text-slate-800"
                                  }`}
                                >
                                  {opsi}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-2.5 border border-slate-150 rounded-xl bg-slate-50 text-xs text-slate-400 italic">
                            Opsi dinonaktifkan untuk bentuk soal ini.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* TAMBAH GAMBAR DI NASKAH SOAL */}
                    <div className="border border-slate-200 rounded-xl p-3.5 space-y-1 bg-white">
                      <label className="flex items-start gap-2.5 cursor-pointer selection:bg-transparent">
                        <input
                          type="checkbox"
                          checked={tambahGambar}
                          onChange={(e) => setTambahGambar(e.target.checked)}
                          className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 border-slate-350 cursor-pointer"
                        />
                        <div className="space-y-0.5 pointer-events-none">
                          <span className="text-[10.5px] font-bold text-slate-700 block uppercase tracking-wide">
                            TAMBAH GAMBAR DI NASKAH SOAL
                          </span>
                          <span className="text-[10px] text-slate-400 block leading-tight">
                            Gambar bisa saja kurang akurat, mohon periksa ulang hasil gambarnya.
                          </span>
                        </div>
                      </label>
                    </div>

                    {/* TINGKAT KESULITAN */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-heading">
                        TINGKAT KESULITAN
                      </label>
                      <p className="text-[10px] text-slate-400 leading-tight">
                        Bagian ini akan menentukan jumlah soal yang dibuat. Naikkan jumlah angka di sisi kanan untuk memperbanyak jumlah soal.
                      </p>
                      
                      <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-3.5">
                        {(["Mudah", "Sedang", "Sulit"] as const).map((level) => {
                          const isActive = activeDifficulties[level];
                          const countValue = difficultyCounts[level] ?? 1;

                          return (
                            <div key={level} className="flex items-center justify-between">
                              <label className="flex items-center gap-3 cursor-pointer selection:bg-transparent select-none">
                                <input
                                  type="checkbox"
                                  checked={isActive}
                                  onChange={(e) => {
                                    setActiveDifficulties(prev => ({
                                      ...prev,
                                      [level]: e.target.checked
                                    }));
                                  }}
                                  className="hidden" // hide native to render custom
                                />
                                {/* Custom Checkbox as in Screenshot (red fill with white checkmark) */}
                                <div className={`w-5 h-5 rounded flex items-center justify-center transition-all border ${
                                  isActive
                                    ? "bg-red-650 border-red-650 text-white"
                                    : "border-slate-300 bg-white"
                                }`}>
                                  {isActive && (
                                    <svg className="w-3.5 h-3.5 stroke-[3.5] stroke-current" fill="none" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                  )}
                                </div>
                                <span className="text-sm font-bold text-slate-700 font-sans">
                                  {level}
                                </span>
                              </label>

                              <div>
                                <input
                                  type="number"
                                  min={0}
                                  max={20}
                                  value={countValue}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    setDifficultyCounts(prev => ({
                                      ...prev,
                                      [level]: val
                                    }));
                                    if (val > 0 && !isActive) {
                                      setActiveDifficulties(prev => ({
                                        ...prev,
                                        [level]: true
                                      }));
                                    }
                                  }}
                                  className="w-14 h-8 text-center text-xs font-bold border border-slate-250 rounded bg-white text-slate-800 focus:outline-none focus:border-slate-400 font-sans"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2.5 py-1 rounded">
                          Total Soal Bagian Ini: <span className="text-emerald-700 font-black">{totalSoal}</span>
                        </span>
                      </div>
                    </div>

                    {/* DIMENSI KOGNITIF */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-heading">
                        DIMENSI KOGNITIF
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* LOTS */}
                        <div className="space-y-1.5">
                          <span className="text-[9px] font-bold text-slate-400 block tracking-wide uppercase font-mono">LOTS (LOWER ORDER THINKING)</span>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[
                              { key: "C1", label: "Mengingat" },
                              { key: "C2", label: "Memahami" },
                              { key: "C3", label: "Menerapkan" }
                            ].map((item) => {
                              const isSelected = dimensiKognitif.includes(item.key);
                              return (
                                <button
                                  type="button"
                                  key={item.key}
                                  onClick={() => {
                                    setDimensiKognitif(prev =>
                                      prev.includes(item.key)
                                        ? prev.filter(k => k !== item.key)
                                        : [...prev, item.key]
                                    );
                                  }}
                                  className={`p-2.5 rounded-lg text-center transition cursor-pointer border relative select-none ${
                                    isSelected
                                      ? "bg-emerald-800 text-white border-emerald-900 scale-100 font-extrabold shadow-2xs"
                                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                  }`}
                                >
                                  <div className="text-[11px] font-extrabold">{item.key}</div>
                                  <div className="text-[8px] opacity-85 leading-normal font-sans uppercase">{item.label}</div>
                                  {isSelected && (
                                    <span className="absolute top-1 right-1.5 text-[8px] font-black text-emerald-100 font-mono">
                                      ✓
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* HOTS */}
                        <div className="space-y-1.5">
                          <span className="text-[9px] font-bold text-slate-400 block tracking-wide uppercase font-mono">HOTS (HIGHER ORDER THINKING)</span>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[
                              { key: "C4", label: "Menganalisis" },
                              { key: "C5", label: "Mengevaluasi" },
                              { key: "C6", label: "Mencipta" }
                            ].map((item) => {
                              const isSelected = dimensiKognitif.includes(item.key);
                              return (
                                <button
                                  type="button"
                                  key={item.key}
                                  onClick={() => {
                                    setDimensiKognitif(prev =>
                                      prev.includes(item.key)
                                        ? prev.filter(k => k !== item.key)
                                        : [...prev, item.key]
                                    );
                                  }}
                                  className={`p-2.5 rounded-lg text-center transition cursor-pointer border relative select-none ${
                                    isSelected
                                      ? "bg-emerald-800 text-white border-emerald-900 scale-100 font-extrabold shadow-2xs"
                                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                  }`}
                                >
                                  <div className="text-[11px] font-extrabold">{item.key}</div>
                                  <div className="text-[8px] opacity-85 leading-normal font-sans uppercase">{item.label}</div>
                                  {isSelected && (
                                    <span className="absolute top-1 right-1.5 text-[8px] font-black text-emerald-100 font-mono">
                                      ✓
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit Trigger Action */}
                  <div className="flex flex-col sm:flex-row justify-end items-center gap-2 border-t border-slate-100 pt-3.5">
                    <button
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="w-full sm:w-auto px-5 py-2.5 bg-slate-105 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer transition border border-slate-200"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isGenerating}
                      className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-black tracking-wide uppercase flex items-center justify-center gap-2 cursor-pointer transition shadow-xs ${
                        isGenerating
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                          : "bg-emerald-600 border border-emerald-500 text-white hover:bg-emerald-700"
                      }`}
                    >
                      {isGenerating ? (
                        <>
                          <Cpu size={14} className="animate-spin text-emerald-600" />
                          Memproses AI Generator...
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} className="text-yellow-300 animate-bounce" />
                          SINKRONISASI AI & GENERATE
                        </>
                      )}
                    </button>
                  </div>

                  {generationSource && (
                    <div className={`text-[10px] text-center font-bold px-2.5 py-1.5 rounded-lg ${
                      generationSource === "gemini"
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        : "bg-amber-50 text-amber-600 border border-amber-100"
                    }`}>
                      {generationSource === "gemini"
                        ? "✓ Terhubung dengan Gemini AI Engine"
                        : "✓ Berhasil disesuaikan via Fallback Sistem Pintar"}
                    </div>
                  )}
                </form>
              ) : (
                /* Form Butir Soal Pilihan Ganda Baru */
                <form onSubmit={handleAddSubmit} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 animate-fadeIn">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block uppercase">NASKAH PERTANYAAN SOAL *</label>
                      <textarea
                        rows={3}
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                        required
                        placeholder="Masukkan pertanyaan / narasi studi kasus di sini..."
                        className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-slate-50 outline-none focus:border-red-500 resize-none font-sans"
                      ></textarea>
                    </div>

                    <div className="space-y-4 border-y border-slate-100 py-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wide">
                          PILIHAN OPSI JAWABAN *
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-medium text-slate-400">Tentukan Jumlah Opsi:</span>
                          <div className="flex bg-slate-100 border border-slate-250 p-0.5 rounded-lg">
                            {(["ABC", "ABCD"] as const).map((opsi) => {
                              const isActive = manualJumlahOpsi === opsi;
                              return (
                                <button
                                  type="button"
                                  key={opsi}
                                  onClick={() => handleManualJumlahOpsiChange(opsi)}
                                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                                    isActive
                                      ? "bg-red-650 hover:bg-red-700 bg-red-600 text-white shadow-xs"
                                      : "text-slate-500 hover:text-slate-800"
                                  }`}
                                >
                                  {opsi === "ABC" ? "3 Opsi" : "4 Opsi"}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5 text-xs">
                        <div className="flex items-center gap-2 select-none">
                          <span className="font-bold text-slate-500 shrink-0 w-5">A:</span>
                          <input
                            type="text"
                            value={optionA}
                            onChange={(e) => setOptionA(e.target.value)}
                            required
                            placeholder="Ketikkan teks opsi jawaban A"
                            className="w-full border border-slate-200 p-2.5 rounded-lg bg-slate-50 outline-none focus:border-red-500 font-sans"
                          />
                        </div>
                        <div className="flex items-center gap-2 select-none">
                          <span className="font-bold text-slate-500 shrink-0 w-5">B:</span>
                          <input
                            type="text"
                            value={optionB}
                            onChange={(e) => setOptionB(e.target.value)}
                            required
                            placeholder="Ketikkan teks opsi jawaban B"
                            className="w-full border border-slate-200 p-2.5 rounded-lg bg-slate-50 outline-none focus:border-red-500 font-sans"
                          />
                        </div>
                        <div className="flex items-center gap-2 animate-fadeIn select-none">
                          <span className="font-bold text-slate-500 shrink-0 w-5">C:</span>
                          <input
                            type="text"
                            value={optionC}
                            onChange={(e) => setOptionC(e.target.value)}
                            required
                            placeholder="Ketikkan teks opsi jawaban C"
                            className="w-full border border-slate-200 p-2.5 rounded-lg bg-slate-50 outline-none focus:border-red-500 font-sans"
                          />
                        </div>
                        {manualJumlahOpsi === "ABCD" && (
                          <div className="flex items-center gap-2 animate-fadeIn select-none">
                            <span className="font-bold text-slate-500 shrink-0 w-5">D:</span>
                            <input
                              type="text"
                              value={optionD}
                              onChange={(e) => setOptionD(e.target.value)}
                              required
                              placeholder="Ketikkan teks opsi jawaban D"
                              className="w-full border border-slate-200 p-2.5 rounded-lg bg-slate-50 outline-none focus:border-red-500 font-sans"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 block uppercase">KUNCI JAWABAN BENAR</label>
                        <select
                          value={correctAnswer}
                          onChange={(e) => setCorrectAnswer(e.target.value as any)}
                          className="w-full text-xs border border-slate-200 p-2.5 rounded-lg outline-none bg-white font-bold cursor-pointer text-slate-700"
                        >
                          <option value="A">Opsi A</option>
                          <option value="B">Opsi B</option>
                          <option value="C">Opsi C</option>
                          {manualJumlahOpsi === "ABCD" && <option value="D">Opsi D</option>}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 block uppercase">NASKAH PEMBAHASAN / SOLUSI</label>
                        <input
                          type="text"
                          value={explanation}
                          onChange={(e) => setExplanation(e.target.value)}
                          placeholder="Contoh: Jawaban diperoleh dari rumus f(10)..."
                          className="w-full text-xs border border-slate-200 p-2 rounded-lg bg-slate-50 outline-none focus:border-red-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition border border-slate-200"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-red-650 hover:bg-red-700 bg-red-600 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer transition"
                    >
                      Simpan Butir Baru
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 text-sm">Daftar Butir Pertanyaan ({filteredQuestions.length})</h3>

              {filteredQuestions.length > 0 ? (
                filteredQuestions.map((q, idx) => (
                  <div key={q.id} className="bg-white p-5 rounded-xl border border-slate-150 shadow-2xs space-y-4 animate-fadeIn">
                    <div className="flex justify-between items-start">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold font-mono rounded">
                        PERTANYAAN #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeleteQuestion(q.id)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded-md hover:bg-slate-50 cursor-pointer"
                        title="Hapus Butir Pertanyaan"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <p className="text-slate-800 text-xs font-medium leading-relaxed font-sans">{q.questionText}</p>

                    {/* Options array listed list */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-sans">
                      {q.options.map((opt) => {
                        const isCorrect = q.correctAnswer === opt.key;
                        return (
                          <div
                            key={opt.key}
                            className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                              isCorrect
                                ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold"
                                : "bg-slate-550/10 border-slate-100 text-slate-600"
                            }`}
                          >
                            <span
                              className={`w-5 h-5 leading-5 text-center text-[10px] font-bold rounded-full ${
                                isCorrect
                                  ? "bg-emerald-500 text-white"
                                  : "bg-slate-200 text-slate-500"
                              }`}
                            >
                              {opt.key}
                            </span>
                            <span className="truncate">{opt.text}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Solved details */}
                    {q.explanation && (
                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-[11px] text-slate-500 leading-relaxed font-sans">
                        <span className="font-bold text-slate-700 flex items-center gap-1 mb-1">
                          <CheckCircle size={12} className="text-emerald-500" />
                          Pembahasan Solusi:
                        </span>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-xl border border-slate-150 p-10 text-center font-medium text-slate-400">
                  <HelpCircle size={32} className="mx-auto text-slate-300 mb-2" />
                  Belum ada butir pertanyaan yang ditambahkan ke paket ini. Buatlah butir soal pilihan ganda baru melalui tombol di sebelah kiri.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
