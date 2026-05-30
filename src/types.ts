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
  createdBy?: string;
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
  studentNisn?: string;
  examName: string;
  score: number;
  maxScore: number;
  status: "Lulus" | "Gagal" | "Remedial";
  startTime: string;
  durationMinutes: number;
  answers?: Record<string, "A" | "B" | "C" | "D" | "E">;
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
  mapel?: string;
  kelas?: string;
  token?: string;
}

export interface UserAccount {
  id: string;
  name: string;
  role: "Admin" | "Guru" | "Pengawas" | "Viewer";
  email: string;
  status: "Aktif" | "Nonaktif";
  lastLogin: string;
  username?: string;
  password?: string;
}

export interface ServerTimeConfig {
  useManualTime: boolean;
  offsetMs: number;
}

export interface SystemActivityLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: string;
  userEmail: string;
  action: string;
}

export interface Subject {
  id: string;
  name: string;
}

export interface ClassItem {
  id: string;
  name: string;
}

export interface Teacher {
  id: string;
  name: string;
  mapel: string;
  username: string;
  password?: string;
}

export interface Student {
  id: string;
  nisn: string;
  name: string;
  kelas: string;
  username: string;
  password?: string;
}

