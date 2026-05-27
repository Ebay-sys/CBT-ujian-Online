/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ExamPackage {
  id: string;
  name: string;
  category: string;
  duration: number; // in minutes
  totalQuestions: number;
  description: string;
  difficulty: "Mudah" | "Sedang" | "Sulit";
  createdAt: string;
}

export interface Question {
  id: string;
  packageId: string;
  questionText: string;
  options: {
    key: "A" | "B" | "C" | "D" | "E";
    text: string;
  }[];
  correctAnswer: "A" | "B" | "C" | "D" | "E";
  explanation?: string;
}

export interface SystemUpdate {
  id: string;
  title: string;
  content: string;
  date: string;
  category: "Umum" | "Sistem" | "Ujian";
  isPinned: boolean;
}

export interface ExamHistory {
  id: string;
  studentName: string;
  studentEmail: string;
  examName: string;
  score: number;
  maxScore: number;
  status: "Lulus" | "Gagal" | "Remedial";
  startTime: string;
  durationMinutes: number;
}

export interface LiveParticipant {
  id: string;
  name: string;
  email: string;
  examName: string;
  currentQuestion: number;
  totalQuestions: number;
  status: "Aktif" | "Mencurigakan" | "Offline" | "Selesai" | "Tidak Aktif" | "Belum Mengerjakan" | "Sudah Login" | "Sedang Mengerjakan" | "Selesai Mengerjakan";
  warningsCount: number;
  timeRemaining: number; // in seconds
  lastActive: string;
  ipAddress: string;
}

export interface ExamSchedule {
  id: string;
  title: string;
  packageName: string;
  startTime: string;
  endTime: string;
  isLocked: boolean;
  proctorName: string;
  passTargetPercentage: number; // e.g. 70
}

export interface UserAccount {
  id: string;
  name: string;
  role: "Admin" | "Pengawas" | "Fasilitator";
  email: string;
  status: "Aktif" | "Nonaktif";
  lastLogin: string;
}

export interface ServerTimeConfig {
  useManualTime: boolean;
  offsetMs: number;
}

