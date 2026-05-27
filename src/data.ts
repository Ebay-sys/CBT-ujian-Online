/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ExamPackage,
  Question,
  SystemUpdate,
  ExamHistory,
  LiveParticipant,
  ExamSchedule,
  UserAccount
} from "./types";

export const INITIAL_PACKAGES: ExamPackage[] = [
  {
    id: "pkg-1",
    name: "Evaluasi Harian Matematika: Pecahan Senilai (Kelas 4)",
    category: "Matematika SD",
    duration: 60,
    totalQuestions: 20,
    description: "Evaluasi pemahaman konsep pecahan senilai, pencerahan pecahan lewat gambar visual, dan menyederhanakan pembilang-penyebut untuk siswa Kelas IV.",
    difficulty: "Sedang",
    createdAt: "2026-05-10"
  },
  {
    id: "pkg-2",
    name: "Latihan Akhir Bab IPAS: Siklus Makhluk Hidup (Kelas 4)",
    category: "IPAS (Sains)",
    duration: 60,
    totalQuestions: 25,
    description: "Menguji daya tangkap siswa mengenai metamorfosis sempurna dan tidak sempurna pada hewan, siklus tumbuhan, dan simbiosis lingkungan.",
    difficulty: "Sedang",
    createdAt: "2026-05-12"
  },
  {
    id: "pkg-3",
    name: "Ujian Bahasa Indonesia: Literasi Menulis (Kelas 4)",
    category: "Bahasa Indonesia",
    duration: 60,
    totalQuestions: 15,
    description: "Penilaian kompetensi membaca paragraf pendek, menentukan kalimat utama, gagasan pokok, serta kepatuhan tanda baca fungsional.",
    difficulty: "Mudah",
    createdAt: "2026-05-15"
  },
  {
    id: "pkg-4",
    name: "Latihan Soal Matematika: KPK dan FPB (Kelas 5)",
    category: "Matematika SD",
    duration: 90,
    totalQuestions: 30,
    description: "Uji kemampuan berpikir analitis dalam memecahkan soal cerita FPB pembagian sembako dan KPK jadwal ronda ronda berkala.",
    difficulty: "Sulit",
    createdAt: "2026-05-18"
  },
  {
    id: "pkg-5",
    name: "Evaluasi Pendidikan Pancasila: Nilai & Simbol (Kelas 4)",
    category: "Pendidikan Pancasila",
    duration: 45,
    totalQuestions: 20,
    description: "Mengukur pemahaman siswa dalam mengenali simbol sila Pancasila, contoh perilaku gotong royong, dan penerapan aturan di rukun tetangga.",
    difficulty: "Mudah",
    createdAt: "2026-05-20"
  }
];

export const INITIAL_QUESTIONS: Question[] = [
  // Package 1
  {
    id: "q-1-1",
    packageId: "pkg-1",
    questionText: "Zacky membeli sebuah martabak manis dan memotongnya menjadi 8 bagian sama besar. Jika Zacky memakan 2 potong martabak, pecahan manakah berikut ini yang senilai dengan bagian martabak yang dimakan Zacky?",
    options: [
      { key: "A", text: "1/2" },
      { key: "B", text: "1/4" },
      { key: "C", text: "1/8" },
      { key: "D", text: "2/4" },
      { key: "E", text: "3/8" }
    ],
    correctAnswer: "B",
    explanation: "Pembahasan: Martabak yang dimakan Zacky adalah 2 dari 8 bagian, ditulis 2/8. Jika pembilang dan penyebut masing-masing dibagi 2 (disederhanakan), maka diperoleh 2/8 = 1/4. Oleh karena itu, pecahan yang senilai adalah 1/4."
  },
  {
    id: "q-1-2",
    packageId: "pkg-1",
    questionText: "Beni memiliki selembar kertas gambar. Ia mewarnai 3/6 bagian kertas tersebut dengan warna merah. Kadek ingin mewarnai kertas miliknya dengan luas warna yang senilai dengan Beni. Pecahan manakah yang senilai dengan pecahan milik Beni?",
    options: [
      { key: "A", text: "1/2" },
      { key: "B", text: "1/3" },
      { key: "C", text: "2/3" },
      { key: "D", text: "2/5" },
     
    ],
    correctAnswer: "A",
    explanation: "Pembahasan: Pecahan milik Beni adalah 3/6. Jika disederhanakan dengan membagi pembilang dan penyebut dengan angka 3, maka akan diperoleh 3/6 ÷ 3/3 = 1/2. Pecahan yang senilai dengannya adalah 1/2."
  },
  {
    id: "q-1-3",
    packageId: "pkg-1",
    questionText: "Manakah di bawah ini pernyataan perbandingan pecahan yang paling tepat?",
    options: [
      { key: "A", text: "2/5 lebih kecil dari 1/5" },
      { key: "B", text: "1/3 lebih besar dari 2/3" },
      { key: "C", text: "3/4 lebih besar dari 1/4" },
      { key: "D", text: "1/2 lebih kecil dari 1/4" },
      { key: "E", text: "2/8 lebih besar dari 4/8" }
    ],
    correctAnswer: "C",
    explanation: "Pembahasan: Pada pecahan yang memiliki penyebut sama, kita hanya perlu membandingkan pembilangnya. Karena 3 > 1, maka pecahan 3/4 lebih besar dari 1/4. Pernyataan C adalah yang paling tepat."
  },

  // Package 2
  {
    id: "q-2-1",
    packageId: "pkg-2",
    questionText: "Kupu-kupu berkembang biak dengan bertelur. Setelah telur menetas, ia akan berubah menjadi ulat (larva), kemudian kepompong (pupa), dan akhirnya menjadi kupu-kupu dewasa. Urutan daur hidup kupu-kupu ini termasuk dalam jenis metamorfosis...",
    options: [
      { key: "A", text: "Sempurna" },
      { key: "B", text: "Tidak Sempurna" },
      { key: "C", text: "Tanpa Perubahan bentuk" },
      { key: "D", text: "Metamorfosis Buatan" },
      { key: "E", text: "Metamorfosis Lambat" }
    ],
    correctAnswer: "A",
    explanation: "Pembahasan: Kupu-kupu mengalami metamorfosis sempurna karena bentuk tubuhnya saat fase muda (ulat) berbeda sangat jauh dengan bentuk saat dewasa (kupu-kupu) dan melewati fase kepompong (pupa)."
  },
  {
    id: "q-2-2",
    packageId: "pkg-2",
    questionText: "Tumbuhan hijau mampu membuat makanannya sendiri melalui proses kimiawi di daun dengan bantuan sinar matahari. Proses pembuatan makanan pada tumbuhan hijau ini dinamakan...",
    options: [
      { key: "A", text: "Respirasi" },
      { key: "B", text: "Metamorfosis" },
      { key: "C", text: "Fotosintesis" },
      { key: "D", text: "Karnivora" },
      { key: "E", text: "Penyerbukan" }
    ],
    correctAnswer: "C",
    explanation: "Pembahasan: Fotosintesis adalah proses di mana tumbuhan hijau memanfaatkan energi matahari, karbon dioksida dari udara, dan air dari tanah untuk membuat makanannya sendiri (karbohidrat) dan melepaskan oksigen."
  }
];

export const INITIAL_UPDATES: SystemUpdate[] = [
  {
    id: "upd-1",
    title: "Pembaruan Fitur Deteksi Window Switching (CBT Lockdown Pro SDN 14)",
    content: "Sistem CBT kini mendeteksi aktivitas keluar jendela ujian lebih akurat untuk mencegah kecurangan. Peserta didik yang keluar dari tab browser selama ujian sebanyak 3 kali akan dinonaktifkan otomatis dan membutuhkan token aktivasi dari Guru Pengawas di kelas.",
    date: "2026-05-24",
    category: "Sistem",
    isPinned: true
  },
  {
    id: "upd-2",
    title: "Jadwal Evaluasi Akhir Semester Genap Berbasis CBT Online",
    content: "Diberitahukan kepada seluruh guru, pengawas, dan siswa kelas 4, 5, dan 6 bahwa pelaksanaan ujian mandiri CBT SDN 14 Singkawang akan dimulai serentak pada tanggal 26-29 Mei 2026. Mohon pastikan laptop atau Chromebook terhubung ke Wi-Fi sekolah.",
    date: "2026-05-20",
    category: "Ujian",
    isPinned: true
  },
  {
    id: "upd-3",
    title: "Rilis Grafik Statistik Nilai dan Analisis Capaian Belajar Siswa",
    content: "Guru kini dapat melihat diagram grafik statistik rata-rata skor nilai kelas secara langsung dari dashboard proctor untuk mempermudah pemetaan remedial siswa tanpa perlu koreksi manual.",
    date: "2026-05-15",
    category: "Umum",
    isPinned: false
  }
];

export const INITIAL_HISTORY: ExamHistory[] = [];

export const INITIAL_PARTICIPANTS: LiveParticipant[] = [];

export const INITIAL_SCHEDULES: ExamSchedule[] = [
  {
    id: "sch-1",
    title: "Penilaian Harian Matematika Pecahan Kelas IV-A",
    packageName: "Evaluasi Harian Matematika: Pecahan Senilai (Kelas 4)",
    startTime: "2026-05-26 08:00 WIB",
    endTime: "2026-05-26 09:30 WIB",
    isLocked: false,
    proctorName: "Pak Hendra Wijaya",
    passTargetPercentage: 70
  },
  {
    id: "sch-2",
    title: "Penilaian Sumatif Tengah Semester IPAS IV-B",
    packageName: "Latihan Akhir Bab IPAS: Siklus Makhluk Hidup (Kelas 4)",
    startTime: "2026-05-26 10:00 WIB",
    endTime: "2026-05-26 11:30 WIB",
    isLocked: false,
    proctorName: "Ibu Shanti Puspita",
    passTargetPercentage: 70
  },
  {
    id: "sch-3",
    title: "Evaluasi Akhir Semester Pendidikan Pancasila IV",
    packageName: "Evaluasi Pendidikan Pancasila: Nilai & Simbol (Kelas 4)",
    startTime: "2026-05-27 08:00 WIB",
    endTime: "2026-05-27 09:30 WIB",
    isLocked: true,
    proctorName: "Sistem Otomatis",
    passTargetPercentage: 70
  }
];

export const INITIAL_ACCOUNTS: UserAccount[] = [
  {
    id: "acc-1",
    name: "Guru Admin SDN 14",
    role: "Admin",
    email: "admin.sdn14@singkawang.sch.id",
    status: "Aktif",
    lastLogin: "Baru saja"
  },
  {
    id: "acc-2",
    name: "Hendra Wijaya",
    role: "Pengawas",
    email: "hendra.guru@singkawang.sch.id",
    status: "Aktif",
    lastLogin: "2 jam lalu"
  },
  {
    id: "acc-3",
    name: "Shanti Puspita",
    role: "Fasilitator",
    email: "shanti.guru@singkawang.sch.id",
    status: "Aktif",
    lastLogin: "1 hari lalu"
  },
  {
    id: "acc-4",
    name: "Sari Handayani",
    role: "Pengawas",
    email: "sari.proctor@singkawang.sch.id",
    status: "Nonaktif",
    lastLogin: "5 hari lalu"
  }
];

export const REGISTRATION_CHART_DATA = [
  { label: "Jan", count: 680, change: "+5%" },
  { label: "Feb", count: 750, change: "+10%" },
  { label: "Mar", count: 810, change: "+8%" },
  { label: "Apr", count: 880, change: "+9%" },
  { label: "Mei", count: 910, change: "+3%" },
  { label: "Jun", count: 980, change: "+8%" },
  { label: "Jul", count: 1250, change: "+27%" }
];
