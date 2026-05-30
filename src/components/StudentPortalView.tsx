/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  BookOpen,
  User,
  Mail,
  Key,
  Clock,
  CheckCircle,
  AlertTriangle,
  Lock,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  FileText,
  Award,
  LogOut,
  RefreshCw,
  ShieldAlert,
  Printer,
  X,
  Compass,
  Download,
  Eye,
  ZoomIn,
  ZoomOut,
  XCircle
} from "lucide-react";
import { ExamSchedule, ExamPackage, Question, LiveParticipant, ExamHistory, ServerTimeConfig } from "../types";

interface StudentPortalViewProps {
  schedules: ExamSchedule[];
  packages: ExamPackage[];
  questions: Question[];
  participants: LiveParticipant[];
  onSetParticipants: React.Dispatch<React.SetStateAction<LiveParticipant[]>>;
  history: ExamHistory[];
  onAddHistory: (newHistory: ExamHistory) => void;
  onGoBack?: () => void;
  serverTimeConfig?: ServerTimeConfig;
}

export function renderQuestionText(text: string) {
  if (!text) return null;
  
  let stimulusIndex = text.toUpperCase().indexOf("STIMULUS:");
  let stimulusTermLength = 9;
  if (stimulusIndex === -1) {
    stimulusIndex = text.toUpperCase().indexOf("STIMULUS");
    stimulusTermLength = 8;
  }
  
  let pertanyaanIndex = text.toUpperCase().indexOf("PERTANYAAN:");
  let pertanyaanTermLength = 11;
  if (pertanyaanIndex === -1) {
    pertanyaanIndex = text.toUpperCase().indexOf("PERTANYAAN");
    pertanyaanTermLength = 10;
  }
  
  if (stimulusIndex !== -1 && pertanyaanIndex !== -1 && pertanyaanIndex > stimulusIndex) {
    const metadata = text.substring(0, stimulusIndex).trim();
    const stimulus = text.substring(stimulusIndex + stimulusTermLength, pertanyaanIndex).trim();
    const pertanyaan = text.substring(pertanyaanIndex + pertanyaanTermLength).trim();
    
    return (
      <div className="space-y-3.5">
        {metadata && (
          <div className="text-[10px] font-bold text-red-700 font-mono flex items-center gap-1 bg-red-100/50 border border-red-200/50 px-2 py-0.5 rounded w-fit uppercase">
            {metadata}
          </div>
        )}
        <div className="border border-red-100 bg-red-500/[0.03] rounded-xl p-4 text-xs text-slate-800 leading-relaxed shadow-3xs">
          <div className="flex items-center gap-1.5 text-red-700 font-bold mb-2 text-[10px] font-mono tracking-wider uppercase">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
            📚 STIMULUS BAHASAN
          </div>
          <p className="whitespace-pre-wrap font-medium text-slate-700 leading-relaxed">{stimulus}</p>
        </div>
        <div className="border border-indigo-150 bg-indigo-500/[0.02] rounded-xl p-4 text-xs text-slate-800 leading-relaxed shadow-3xs">
          <div className="flex items-center gap-1.5 text-indigo-700 font-bold mb-2 text-[10px] font-mono tracking-wider uppercase">
            <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
            ❓ PERTANYAAN UTAMA
          </div>
          <p className="whitespace-pre-wrap font-extrabold text-slate-900 text-xs leading-relaxed">{pertanyaan}</p>
        </div>
      </div>
    );
  }
  
  return (
    <p className="whitespace-pre-wrap leading-relaxed font-sans font-medium text-slate-800">
      {text}
    </p>
  );
}

export default function StudentPortalView({
  schedules,
  packages,
  questions,
  participants,
  onSetParticipants,
  history,
  onAddHistory,
  onGoBack,
  serverTimeConfig = { useManualTime: false, offsetMs: 0 }
}: StudentPortalViewProps) {
  // Session States
  const [activeSession, setActiveSession] = useState<{
    id: string; // LiveParticipant ID
    studentName: string;
    studentEmail: string;
    studentNisn: string;
    scheduleId: string;
    scheduleTitle: string;
    packageName: string;
    timeRemaining: number; // in seconds
    totalQuestions: number;
    kkm: number;
  } | null>(() => {
    const saved = localStorage.getItem("active_student_exam_session");
    return saved ? JSON.parse(saved) : null;
  });

  // Login Form States
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentNisn, setStudentNisn] = useState("");
  const [selectedScheduleId, setSelectedScheduleId] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [hasAgreedRules, setHasAgreedRules] = useState(false);
  const [currentStep, setCurrentStep] = useState<"login" | "briefing" | "exam" | "score">("login");
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Dynamic ticking student WIB clock using the synced manual server offset
  const [studentNow, setStudentNow] = useState(Date.now());

  useEffect(() => {
    const clockTimer = setInterval(() => {
      setStudentNow(Date.now());
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  const getSimulatedStudentTime = () => {
    return studentNow + (serverTimeConfig?.offsetMs || 0);
  };

  const formatStudentTimeWIB = (timestamp: number) => {
    // WIB is UTC+7
    const wibDate = new Date(timestamp + 7 * 60 * 60 * 1000);
    const yr = wibDate.getUTCFullYear();
    const mo = String(wibDate.getUTCMonth() + 1).padStart(2, "0");
    const dy = String(wibDate.getUTCDate()).padStart(2, "0");
    const hr = String(wibDate.getUTCHours()).padStart(2, "0");
    const mn = String(wibDate.getUTCMinutes()).padStart(2, "0");
    const sc = String(wibDate.getUTCSeconds()).padStart(2, "0");
    return `${yr}-${mo}-${dy} ${hr}:${mn}:${sc} WIB`;
  };

  // Active Exam States
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, "A" | "B" | "C" | "D" | "E">>(() => {
    try {
      const activeSaved = localStorage.getItem("active_student_exam_session");
      if (activeSaved) {
        const parsed = JSON.parse(activeSaved);
        if (parsed && parsed.id) {
          const ansSaved = localStorage.getItem(`cbt_student_answers_${parsed.id}`);
          return ansSaved ? JSON.parse(ansSaved) : {};
        }
      }
    } catch (e) {
      console.error("Error loading saved student answers", e);
    }
    return {};
  });

  const [raguState, setRaguState] = useState<Record<string, boolean>>(() => {
    try {
      const activeSaved = localStorage.getItem("active_student_exam_session");
      if (activeSaved) {
        const parsed = JSON.parse(activeSaved);
        if (parsed && parsed.id) {
          const raguSaved = localStorage.getItem(`cbt_student_ragu_${parsed.id}`);
          return raguSaved ? JSON.parse(raguSaved) : {};
        }
      }
    } catch (e) {
      console.error("Error loading saved ragu state", e);
    }
    return {};
  });

  const [isCheatWarningVisible, setIsCheatWarningVisible] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // Auto-save student answers and doubt state to localStorage on any changes
  useEffect(() => {
    if (activeSession && activeSession.id) {
      localStorage.setItem(`cbt_student_answers_${activeSession.id}`, JSON.stringify(userAnswers));
    }
  }, [userAnswers, activeSession?.id]);

  useEffect(() => {
    if (activeSession && activeSession.id) {
      localStorage.setItem(`cbt_student_ragu_${activeSession.id}`, JSON.stringify(raguState));
    }
  }, [raguState, activeSession?.id]);

  // Score Screen result state
  const [endedExamResult, setEndedExamResult] = useState<{
    id?: string;
    studentName: string;
    studentEmail: string;
    studentNisn?: string;
    examName: string;
    score: number;
    maxScore: number;
    correctCount: number;
    wrongCount: number;
    unansweredCount: number;
    status: "Lulus" | "Gagal" | "Remedial";
    durationMinutes: number;
    kkm: number;
    startTime?: string;
    answers?: Record<string, "A" | "B" | "C" | "D" | "E">;
  } | null>(null);

  const [previewResult, setPreviewResult] = useState<any | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showAnswerSheetReview, setShowAnswerSheetReview] = useState(false);

  // Real-time synchronization metrics
  const [lastSyncDelta, setLastSyncDelta] = useState<number>(0);
  const [totalSavedTicks, setTotalSavedTicks] = useState<number>(0);

  // Focus reference
  const containerRef = useRef<HTMLDivElement>(null);

  // Avoid closure stale state inside the high-resolution 20ms interval
  const participantsRef = useRef(participants);
  participantsRef.current = participants;

  const historyRef = useRef(history);
  historyRef.current = history;

  const userAnswersRef = useRef(userAnswers);
  userAnswersRef.current = userAnswers;

  const handleSubmitExamRef = useRef<any>(null);
  const handleTerminateAndShowScoreRef = useRef<any>(null);
  const handleManualClearSessionRef = useRef<any>(null);

  // Get active schedule's package details
  const getSelectedScheduleDetails = () => {
    const sch = schedules.find((s) => s.id === selectedScheduleId);
    if (!sch) return null;
    const pkg = packages.find((p) => p.name === sch.packageName);
    return { schedule: sch, package: pkg };
  };

  // Sync session with local storage
  useEffect(() => {
    if (activeSession) {
      localStorage.setItem("active_student_exam_session", JSON.stringify(activeSession));
      setCurrentStep("exam");
    } else {
      localStorage.removeItem("active_student_exam_session");
    }
  }, [activeSession]);

  // Handle Login & Validation before pre-briefing step
  const handleValidateLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !studentEmail.trim()) {
      alert("Harap lengkapi semua isian formulir login!");
      return;
    }
    if (!selectedScheduleId) {
      alert("Silakan pilih sesi ujian aktif!");
      return;
    }

    const details = getSelectedScheduleDetails();
    if (!details || !details.schedule) {
      alert("Sesi ujian tidak valid!");
      return;
    }
    const { schedule, package: selectedPkg } = details;

    if (schedule.isLocked) {
      alert("Sesi ujian ini sedang TERKUNCI oleh pengawas. Silakan hubungi proctor Ruang!");
      return;
    }

    // Go to briefing step
    setCurrentStep("briefing");

    // Pre-register student to live participants list with "Belum Mengerjakan" status
    const examQuestions = questions.filter((q) => q.packageId === selectedPkg?.id);
    const totalQuestions = examQuestions.length > 0 ? examQuestions.length : (selectedPkg?.totalQuestions || 30);
    const durationMinutes = selectedPkg?.duration || 120;

    const emailKey = studentEmail.toLowerCase().trim();
    const exists = participants.some((p) => p.email.toLowerCase().trim() === emailKey);
    if (!exists) {
      const participantId = `student-live-${Date.now()}`;
      const newParticipant: LiveParticipant = {
        id: participantId,
        name: studentName,
        email: studentEmail,
        examName: schedule.packageName,
        currentQuestion: 0,
        totalQuestions: totalQuestions,
        status: "Belum Mengerjakan",
        warningsCount: 0,
        timeRemaining: durationMinutes * 60,
        lastActive: "Baru saja login",
        ipAddress: `192.168.10.${Math.floor(Math.random() * 89) + 10}`
      };
      onSetParticipants((prev) => [newParticipant, ...prev]);
    }
  };

  // Start actual exam, register candidate as live participant
  const handleStartExam = () => {
    if (!hasAgreedRules) {
      alert("Anda harus menyetujui seluruh aturan integritas ujian terlebih dahulu!");
      return;
    }

    const details = getSelectedScheduleDetails();
    if (!details || !details.schedule) return;

    const selectedPkg = details.package;
    // Set total questions: use actual questions count or fallback to package schema
    const examQuestions = questions.filter((q) => q.packageId === selectedPkg?.id);
    const totalQuestions = examQuestions.length > 0 ? examQuestions.length : (selectedPkg?.totalQuestions || 30);
    const durationMinutes = selectedPkg?.duration || 120;

    const emailKey = studentEmail.toLowerCase().trim();
    const existing = participants.find((p) => p.email.toLowerCase().trim() === emailKey);
    const participantId = existing ? existing.id : `student-live-${Date.now()}`;

    // Add to or update live participant stream
    onSetParticipants((prev) => {
      const isAlreadyInList = prev.some((p) => p.email.toLowerCase().trim() === emailKey);
      if (isAlreadyInList) {
        return prev.map((p) => {
          if (p.email.toLowerCase().trim() === emailKey) {
            return {
              ...p,
              status: "Aktif",
              currentQuestion: 1,
              lastActive: "Baru saja mulai"
            };
          }
          return p;
        });
      } else {
        const newParticipant: LiveParticipant = {
          id: participantId,
          name: studentName,
          email: studentEmail,
          examName: details.schedule.packageName,
          currentQuestion: 1,
          totalQuestions: totalQuestions,
          status: "Aktif",
          warningsCount: 0,
          timeRemaining: durationMinutes * 60,
          lastActive: "Baru saja mulai",
          ipAddress: `192.168.10.${Math.floor(Math.random() * 89) + 10}`
        };
        return [newParticipant, ...prev];
      }
    });

    // Save student active context
    setActiveSession({
      id: participantId,
      studentName: studentName,
      studentEmail: studentEmail,
      studentNisn: studentNisn,
      scheduleId: selectedScheduleId,
      scheduleTitle: details.schedule.title,
      packageName: details.schedule.packageName,
      timeRemaining: durationMinutes * 60,
      totalQuestions: totalQuestions,
      kkm: details.schedule.passTargetPercentage
    });

    setCurrentStep("exam");
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setRaguState({});
  };

  // Focus Lost Warning & Lockdown Monitor
  useEffect(() => {
    if (currentStep !== "exam" || !activeSession) return;

    const handleFocusLoss = () => {
      // Find the participant to check warnings
      onSetParticipants((prev) => {
        return prev.map((p) => {
          if (p.id === activeSession.id) {
            const nextWarnings = p.warningsCount + 1;
            let nextStatus: LiveParticipant["status"] = p.status;

            if (nextWarnings >= 3) {
              nextStatus = "Offline"; // Lock candidate automatically
            } else {
              nextStatus = "Mencurigakan";
            }

            // Trigger on-screen alarm warning box
            setIsCheatWarningVisible(true);

            // Broadcast real-time event to proctors instantly via dynamic WebSocket channel
            if (typeof (window as any).sendCbtInfraction === "function") {
              (window as any).sendCbtInfraction(
                p.id,
                p.name,
                `Meninggalkan lembar ujian (membuka tab / aplikasi lain). Jumlah pelanggaran: ${nextWarnings}/3`,
                nextWarnings
              );
            }

            return {
              ...p,
              warningsCount: nextWarnings,
              status: nextStatus,
              lastActive: "Terdeteksi Tab Out!"
            };
          }
          return p;
        });
      });
    };

    window.addEventListener("blur", handleFocusLoss);
    return () => {
      window.removeEventListener("blur", handleFocusLoss);
    };
  }, [currentStep, activeSession]);

  // Read current participant status from parent to handle Admin Actions in real time (e.g. Force Submit, Unblock Token)
  // Run checks with highly-precise millisecond timers (20ms resolution) and throttled network synchronizer (100ms)
  useEffect(() => {
    if (currentStep !== "exam" || !activeSession) return;

    // Baseline definitions
    let currentRemainingSeconds = activeSession.timeRemaining;
    let lastSyncTime = Date.now();
    let lastLocalTick = Date.now();

    // High-resolution interval ticking every 20ms (50 times a second)
    const interval = setInterval(() => {
      // Always look up key properties using refs to prevent stale reactive closures
      const match = participantsRef.current.find((p) => p.id === activeSession.id);

      if (!match) {
        // Participant was deleted or force submitted by admin where they were converted into history record!
        // Try to find if a history record was added recently for this student
        const matchedHistory = historyRef.current.find(
          (h) => h.studentEmail === activeSession.studentEmail && h.examName === activeSession.packageName
        );

        if (matchedHistory) {
          // Ujian has been force submitted by Admin
          handleTerminateAndShowScoreRef.current(matchedHistory);
        } else {
          // Force closed silently
          alert("Sesi simulasi ujian Anda telah dihentikan/diselesaikan oleh Pengawas.");
          handleManualClearSessionRef.current();
        }
        clearInterval(interval);
        return;
      }

      // Check if time is up
      if (match.timeRemaining <= 0 || match.status === "Selesai") {
        handleSubmitExamRef.current(true);
        clearInterval(interval);
        return;
      }

      // Use system clock delta time for absolute, drift-free precision
      const now = Date.now();
      const deltaLocal = now - lastLocalTick;
      lastLocalTick = now;

      // Decrement the time precisely inside our local tracker
      if (match.status === "Aktif") {
        currentRemainingSeconds = Math.max(0, currentRemainingSeconds - (deltaLocal / 1000));
      } else {
        // If suspended / paused, keep local clock synchronized in lockstep with the server
        currentRemainingSeconds = match.timeRemaining;
      }

      // 1. Update the student portal state immediately at 20ms resolution for ultra-smooth rendering
      setActiveSession((prev) => {
        if (!prev) return null;
        if (Math.abs(prev.timeRemaining - currentRemainingSeconds) < 0.001) return prev;
        return {
          ...prev,
          timeRemaining: currentRemainingSeconds
        };
      });

      // 2. Synchronize to the backend / Proctor monitor via WebSocket at precisely 100ms (0.1s resolution)
      const timeSinceLastSync = now - lastSyncTime;
      if (timeSinceLastSync >= 100) {
        lastSyncTime = now;

        setLastSyncDelta(deltaLocal);
        setTotalSavedTicks((prev) => prev + 1);

        onSetParticipants((prev) =>
          prev.map((p) => {
            if (p.id === activeSession.id) {
              return {
                ...p,
                timeRemaining: currentRemainingSeconds,
                lastActive: "Sedang mengerjakan ujian secara real-time"
              };
            }
            return p;
          })
        );
      }
    }, 20); // 20ms high-resolution ticking (50 FPS)

    return () => clearInterval(interval);
  }, [currentStep, activeSession?.id, onSetParticipants]);

  const handleUpdateActiveQuestionProgress = (newIdx: number) => {
    setCurrentQuestionIndex(newIdx);
    if (!activeSession) return;

    onSetParticipants((prev) =>
      prev.map((p) => (p.id === activeSession.id ? { ...p, currentQuestion: newIdx + 1 } : p))
    );
  };

  // Force show completed score directly from admin intervention
  const handleTerminateAndShowScore = (historyRecord: ExamHistory) => {
    setEndedExamResult({
      id: historyRecord.id,
      studentName: historyRecord.studentName,
      studentEmail: historyRecord.studentEmail,
      studentNisn: historyRecord.studentNisn,
      examName: historyRecord.examName,
      score: historyRecord.score,
      maxScore: historyRecord.maxScore,
      correctCount: Math.round((historyRecord.score / historyRecord.maxScore) * (activeSession?.totalQuestions || 10)),
      wrongCount:
        (activeSession?.totalQuestions || 10) - Math.round((historyRecord.score / historyRecord.maxScore) * (activeSession?.totalQuestions || 10)),
      unansweredCount: 0,
      status: historyRecord.status,
      durationMinutes: historyRecord.durationMinutes,
      kkm: activeSession?.kkm || 75,
      startTime: historyRecord.startTime,
      answers: historyRecord.answers
    });
    setCurrentStep("score");
    setActiveSession(null);
  };

  // Submit and grade the candidate's answers
  const handleSubmitExam = (forceTimeout = false) => {
    if (!activeSession) return;

    const details = getSelectedScheduleDetails();
    const pkg = details?.package;

    // Fetch questions
    const packageQuestions = questions.filter((q) => q.packageId === pkg?.id);
    const hasRealQuestions = packageQuestions.length > 0;

    let correct = 0;
    let wrong = 0;
    let unanswered = 0;
    let score = 0;

    if (hasRealQuestions) {
      packageQuestions.forEach((q) => {
        const studentAns = userAnswers[q.id];
        if (!studentAns) {
          unanswered++;
        } else if (studentAns === q.correctAnswer) {
          correct++;
        } else {
          wrong++;
        }
      });
      const ratio = correct / packageQuestions.length;
      score = Math.round(ratio * 100); // 100 scale
    } else {
      // Simulate grading in fallback mode
      const total = activeSession.totalQuestions;
      const keys = Object.keys(userAnswers);
      const answeredCount = keys.length;
      
      unanswered = total - answeredCount;
      // Assume 82% accuracy for answered fakes
      correct = Math.round(answeredCount * 0.82);
      wrong = answeredCount - correct;
      
      const ratio = total > 0 ? correct / total : 0;
      score = Math.round(ratio * 100);
    }

    const percentage = score;
    const status: "Lulus" | "Gagal" | "Remedial" =
      percentage >= activeSession.kkm ? "Lulus" : "Remedial";

    const durationUsedMinutes = Math.max(
      1,
      Math.round(((pkg?.duration || 120) * 60 - activeSession.timeRemaining) / 60)
    );

    const completedRecord: ExamHistory = {
      id: `hist-${Date.now()}`,
      studentName: activeSession.studentName,
      studentEmail: activeSession.studentEmail,
      studentNisn: activeSession.studentNisn,
      examName: activeSession.packageName,
      score: score,
      maxScore: 100,
      status: status,
      startTime: new Date(Date.now() + (serverTimeConfig?.offsetMs || 0)).toISOString().replace("T", " ").slice(0, 16),
      durationMinutes: durationUsedMinutes,
      answers: userAnswers
    };

    // 1. Save globally
    onAddHistory(completedRecord);

    // 2. Remove from live participant metrics
    onSetParticipants((prev) => prev.filter((p) => p.id !== activeSession.id));

    // 3. Store result locally for score breakdown screen
    setEndedExamResult({
      id: completedRecord.id,
      studentName: activeSession.studentName,
      studentEmail: activeSession.studentEmail,
      studentNisn: activeSession.studentNisn,
      examName: activeSession.packageName,
      score: score,
      maxScore: 100,
      correctCount: correct,
      wrongCount: wrong,
      unansweredCount: unanswered,
      status: status,
      durationMinutes: durationUsedMinutes,
      kkm: activeSession.kkm,
      startTime: completedRecord.startTime,
      answers: userAnswers
    });

    // 4. Reset sessions
    try {
      localStorage.removeItem(`cbt_student_answers_${activeSession.id}`);
      localStorage.removeItem(`cbt_student_ragu_${activeSession.id}`);
    } catch (e) {
      console.error(e);
    }
    setCurrentStep("score");
    setActiveSession(null);
    setShowSubmitConfirm(false);

    if (forceTimeout) {
      alert("Waktu ujian telah habis! Jawaban Anda telah dikumpulkan otomatis.");
    } else {
      alert(`Selamat! Ujian CBT Anda berhasil disubmit. Nilai akhir: ${score}`);
    }
  };

  const getHistoryQuestions = (item: any) => {
    const pkg = packages.find((p) => p.name === item.examName);
    const pkgQuestions = questions.filter((q) => q.packageId === pkg?.id);
    
    if (pkgQuestions.length > 0) {
      return pkgQuestions;
    }

    const total = pkg?.totalQuestions || 10;
    
    // Estimate or fetch correct/wrong/unanswered counts
    let correctCount = item.correctCount;
    let wrongCount = item.wrongCount;
    let unansweredCount = item.unansweredCount;

    if (correctCount === undefined) {
      correctCount = Math.round((item.score / 100) * total);
      const studentAnswers = item.answers || {};
      const answeredKeysCount = Object.keys(studentAnswers).length;
      unansweredCount = Math.max(0, total - answeredKeysCount);
      wrongCount = Math.max(0, total - correctCount - unansweredCount);
    }

    const mockQuestions: Question[] = [];
    const studentAnswers = item.answers || {};
    let assignedCorrect = 0;
    
    for (let i = 0; i < total; i++) {
      const qId = `mock-q-${i + 1}`;
      const studentAns = studentAnswers[qId];
      const hasAnswered = !!studentAns;
      
      let correctAnswer: "A" | "B" | "C" | "D" | "E" = "B";
      if (hasAnswered) {
        if (assignedCorrect < correctCount) {
          correctAnswer = studentAns;
          assignedCorrect++;
        } else {
          correctAnswer = studentAns === "A" ? "B" : "A";
        }
      } else {
        correctAnswer = "A";
      }
      
      mockQuestions.push({
        id: qId,
        packageId: "mock",
        questionText: `[Butir Soal Latihan] Pertanyaan simulasi nomor ${i + 1} untuk mata pelajaran ${item.examName}. Silakan identifikasi analisis skema yang tepat berdasarkan referensi instruksional sistem.`,
        options: [
          { key: "A", text: "Opsi Solusi Analitik Kompleks Kategori A" },
          { key: "B", text: "Hasil Estimasi Kuantitatif Kategori B (Rekomendasi Utama)" },
          { key: "C", text: "Integrasi Komprehensif Skema Formulasi C" },
          { key: "D", text: "Reduksi Ambigu Variabel Konteks D" },
          { key: "E", text: "Evaluasi Komparatif Data Lapangan E" }
        ],
        correctAnswer: correctAnswer,
        explanation: `Penjelasan terperinci mengenai korelasi teoritis dan pembuktian kualitatif dari jawaban ${correctAnswer}.`
      });
    }
    
    return mockQuestions;
  };

  const handleDownloadDocx = (item: any) => {
    // Obtain questions (real or fallback mock)
    const pkgQuestions = getHistoryQuestions(item);

    const formattedDate = item.startTime || new Date().toISOString().replace("T", " ").slice(0, 16);
    const statusColor = item.status === "Lulus" ? "#166534" : (item.status === "Remedial" ? "#b45309" : "#991b1b");

    let questionsHtml = "";

    if (pkgQuestions.length === 0) {
      questionsHtml = `
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-style: italic; font-family: Arial, sans-serif; font-size: 11pt;">
          Tidak ada data butir soal riil yang terekam di dalam sistem untuk paket ini. Format transkrip rekapitulasi nilai ditampilkan.
        </div>`;
    } else {
      pkgQuestions.forEach((q, index) => {
        const studentAns = item.answers ? item.answers[q.id] : undefined;
        const isCorrect = studentAns === q.correctAnswer;
        const hasAnswered = !!studentAns;

        let optionsHtml = "";
        q.options.forEach((opt) => {
          let optStyle = "font-family: Arial, sans-serif; font-size: 11pt; margin-bottom: 4px; padding: 2px 4px;";
          let suffix = "";

          if (opt.key === q.correctAnswer) {
            optStyle += " color: #166534; font-weight: bold;";
            suffix += " [KUNCI JAWABAN]";
          }

          if (hasAnswered && opt.key === studentAns) {
            if (isCorrect) {
              optStyle += " background-color: #d1fae5; color: #166534; font-weight: bold;";
              suffix += " (✓ Jawaban Siswa - BENAR)";
            } else {
              optStyle += " background-color: #fee2e2; color: #991b1b; font-weight: bold;";
              suffix += " (✗ Jawaban Siswa - SALAH)";
            }
          }

          optionsHtml += `
            <div style="${optStyle}">
              <span style="font-weight: bold;">${opt.key}.</span> ${opt.text}${suffix}
            </div>
          `;
        });

        let blockStatusHeader = "";
        if (hasAnswered) {
          blockStatusHeader = isCorrect
            ? `<span style="color: #166534; font-weight: bold; font-family: Arial, sans-serif; font-size: 10pt;">[BENAR ✓]</span>`
            : `<span style="color: #991b1b; font-weight: bold; font-family: Arial, sans-serif; font-size: 10pt;">[SALAH ✗] (Jawaban Siswa: ${studentAns})</span>`;
        } else {
          blockStatusHeader = `<span style="color: #b45309; font-weight: bold; font-family: Arial, sans-serif; font-size: 10pt;">[BELUM DIJAWAB / TIDAK TERISI]</span>`;
        }

        questionsHtml += `
          <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px dashed #cccccc; font-family: Arial, sans-serif;">
            <div style="font-size: 11pt; font-weight: bold; margin-bottom: 8px; line-height: 1.4;">
              <span style="color: #1e3a8a;">Soal ${index + 1}.</span> ${q.questionText}
              <div style="float: right; font-size: 9.5pt;">${blockStatusHeader}</div>
              <div style="clear: both;"></div>
            </div>
            <div style="margin-left: 15px;">
              ${optionsHtml}
            </div>
            ${q.explanation ? `
              <div style="margin-top: 8px; padding: 8px; background-color: #f9fafb; border-left: 3px solid #9ca3af; font-size: 10pt; color: #4b5563; font-style: italic;">
                <strong>Pembahasan:</strong> ${q.explanation}
              </div>
            ` : ""}
          </div>
        `;
      });
    }

    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>Hasil Ujian - ${item.studentName}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page Section1 {
            size: 21.0cm 29.7cm; /* A4 Paper Format */
            margin: 2.5cm 2.5cm 2.5cm 2.5cm;
            mso-header-margin: 1.25cm;
            mso-footer-margin: 1.25cm;
            mso-paper-source: 0;
          }
          div.Section1 {
            page: Section1;
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #333333;
          }
          .header-title {
            text-align: center;
            font-size: 16.5pt;
            font-weight: bold;
            color: #1e3a8a;
            margin-bottom: 2px;
            text-transform: uppercase;
          }
          .header-subtitle {
            text-align: center;
            font-size: 10pt;
            color: #4b5563;
            margin-bottom: 18px;
            border-bottom: 3px double #1e3a8a;
            padding-bottom: 8px;
          }
          .meta-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
          }
          .meta-table td {
            padding: 6px;
            font-size: 10.5pt;
            vertical-align: top;
          }
          .meta-label {
            width: 150px;
            font-weight: bold;
            color: #4b5563;
          }
          .meta-value {
            border-bottom: 1px solid #e5e7eb;
            color: #111827;
          }
          .score-box {
            border: 1.5pt solid #1e3a8a;
            background-color: #f0fdf4;
            padding: 12px;
            text-align: center;
            margin-top: 10px;
            margin-bottom: 20px;
          }
          .score-title {
            font-size: 10pt;
            font-weight: bold;
            color: #1e3a8a;
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          .score-value {
            font-size: 24pt;
            font-weight: bold;
            color: #166534;
          }
          .score-status {
            font-size: 11pt;
            font-weight: bold;
            margin-top: 4px;
          }
          .section-title {
            font-size: 11.5pt;
            font-weight: bold;
            color: #ffffff;
            background-color: #1e3a8a;
            padding: 6px 12px;
            margin-top: 20px;
            margin-bottom: 15px;
          }
          .footer-note {
            margin-top: 30px;
            text-align: center;
            font-size: 9pt;
            color: #9ca3af;
            border-top: 1.5pt solid #e5e7eb;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="Section1">
          <div class="header-title">Laporan Hasil Evaluasi Computer Based Test (CBT)</div>
          <div class="header-subtitle font-sans">Sistem Pengawasan Terintegrasi & Smart Generator Soal</div>
          
          <table class="meta-table">
            <tr>
              <td class="meta-label">Nama Siswa / Peserta</td>
              <td class="meta-value"><strong>${item.studentName}</strong></td>
              <td class="meta-label">ID Transkrip</td>
              <td class="meta-value"><code>${item.id || "N/A"}</code></td>
            </tr>
            <tr>
              <td class="meta-label">Email Terdaftar</td>
              <td class="meta-value">${item.studentEmail}</td>
              <td class="meta-label">Tanggal Ujian</td>
              <td class="meta-value">${formattedDate}</td>
            </tr>
            <tr>
              <td class="meta-label">NISN Siswa</td>
              <td class="meta-value">${item.studentNisn || "-"}</td>
              <td class="meta-label">Durasi Pengerjaan</td>
              <td class="meta-value">${item.durationMinutes} menit</td>
            </tr>
            <tr>
              <td class="meta-label">Paket Soal Ujian</td>
              <td class="meta-value"><strong>${item.examName}</strong></td>
              <td class="meta-label">Batas KKM Kelulusan</td>
              <td class="meta-value">75 / 100</td>
            </tr>
          </table>
          
          <div class="score-box" style="border-color: ${statusColor};">
            <div class="score-title">Nilai Pencapaian Hasil Ujian</div>
            <div class="score-value" style="color: ${statusColor};">${item.score} <span style="font-size: 12pt; color: #6b7280; font-weight: normal;">dari 100</span></div>
            <div class="score-status" style="color: ${statusColor};">STATUS HASIL: ${item.status.toUpperCase()}</div>
          </div>
          
          <div class="section-title">BUKTI RINCIAN BUTIR SOAL DAN JAWABAN SISWA</div>
          
          ${questionsHtml}
          
          <div class="footer-note">
            Laporan ini digenerasi secara resmi oleh platform Sistem CBT Pintar pada ${new Date().toLocaleString("id-ID")}.<br/>
            <em>Lembar ini dilindungi integritas proctoring digital dan aman digunakan untuk dokumentasi akademik.</em>
          </div>
        </div>
      </body>
      </html>
    `;

    const fileContent = "\ufeff" + htmlContent;
    const blob = new Blob([fileContent], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const formattedFilename = `Laporan_Ujian_${item.studentName.replace(/\s+/g, "_")}_${item.examName.replace(/\s+/g, "_")}.doc`;
    link.setAttribute("download", formattedFilename);
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintDocument = (item: any) => {
    const pkgQuestions = getHistoryQuestions(item);
    const formattedDate = item.startTime || new Date().toISOString().replace("T", " ").slice(0, 16);
    const statusColor = item.status === "Lulus" ? "#166534" : (item.status === "Remedial" ? "#b45309" : "#991b1b");

    let questionsHtml = "";

    if (pkgQuestions.length === 0) {
      questionsHtml = `
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-style: italic; font-family: Arial, sans-serif; font-size: 11pt;">
          Tidak ada data butir soal riil yang terekam di dalam sistem untuk paket ini. Format transkrip rekapitulasi nilai ditampilkan.
        </div>`;
    } else {
      pkgQuestions.forEach((q, index) => {
        const studentAns = item.answers ? item.answers[q.id] : undefined;
        const isCorrect = studentAns === q.correctAnswer;
        const hasAnswered = !!studentAns;

        let optionsHtml = "";
        q.options.forEach((opt) => {
          let optStyle = "font-family: Arial, sans-serif; font-size: 11pt; margin-bottom: 4px; padding: 2px 4px; display: flex; align-items: flex-start;";
          let suffix = "";

          if (opt.key === q.correctAnswer) {
            optStyle += " color: #166534; font-weight: bold;";
            suffix += " [KUNCI JAWABAN]";
          }

          if (hasAnswered && opt.key === studentAns) {
            if (isCorrect) {
              optStyle += " background-color: #d1fae5; color: #166534; font-weight: bold;";
              suffix += " (✓ Jawaban Siswa - BENAR)";
            } else {
              optStyle += " background-color: #fee2e2; color: #991b1b; font-weight: bold;";
              suffix += " (✗ Jawaban Siswa - SALAH)";
            }
          }

          optionsHtml += `
            <div style="${optStyle}">
              <span style="font-weight: bold; margin-right: 6px; flex-shrink: 0;">${opt.key}.</span> 
              <span>${opt.text}${suffix}</span>
            </div>
          `;
        });

        let blockStatusHeader = "";
        if (hasAnswered) {
          blockStatusHeader = isCorrect
            ? `<span style="color: #166534; font-weight: bold; font-family: Arial, sans-serif; font-size: 10pt;">[BENAR ✓]</span>`
            : `<span style="color: #991b1b; font-weight: bold; font-family: Arial, sans-serif; font-size: 10pt;">[SALAH ✗] (Jawaban Siswa: ${studentAns})</span>`;
        } else {
          blockStatusHeader = `<span style="color: #b45309; font-weight: bold; font-family: Arial, sans-serif; font-size: 10pt;">[BELUM DIJAWAB / TIDAK TERISI]</span>`;
        }

        questionsHtml += `
          <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px dashed #cccccc; font-family: Arial, sans-serif; page-break-inside: avoid;">
            <div style="font-size: 11pt; font-weight: bold; margin-bottom: 8px; line-height: 1.4;">
              <span style="color: #1e3a8a;">Soal ${index + 1}.</span> ${q.questionText}
              <div style="float: right; font-size: 9.5pt;">${blockStatusHeader}</div>
              <div style="clear: both;"></div>
            </div>
            <div style="margin-left: 15px;">
              ${optionsHtml}
            </div>
            ${q.explanation ? `
              <div style="margin-top: 8px; padding: 8px; background-color: #f9fafb; border-left: 3px solid #9ca3af; font-size: 10pt; color: #4b5563; font-style: italic; page-break-inside: avoid;">
                <strong>Pembahasan:</strong> ${q.explanation}
              </div>
            ` : ""}
          </div>
        `;
      });
    }

    const htmlContent = `
      <html>
      <head>
        <meta charset="utf-8">
        <title>Hasil Ujian - ${item.studentName}</title>
        <style>
          @page {
            size: A4;
            margin: 20mm;
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #333333;
            margin: 0;
            padding: 0;
          }
          .header-title {
            text-align: center;
            font-size: 16.5pt;
            font-weight: bold;
            color: #1e3a8a;
            margin-bottom: 2px;
            text-transform: uppercase;
          }
          .header-subtitle {
            text-align: center;
            font-size: 10pt;
            color: #4b5563;
            margin-bottom: 18px;
            border-bottom: 3px double #1e3a8a;
            padding-bottom: 8px;
          }
          .meta-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
          }
          .meta-table td {
            padding: 6px;
            font-size: 10.5pt;
            vertical-align: top;
          }
          .meta-label {
            width: 150px;
            font-weight: bold;
            color: #4b5563;
          }
          .meta-value {
            border-bottom: 1px solid #e5e7eb;
            color: #111827;
          }
          .score-box {
            border: 1.5pt solid #1e3a8a;
            background-color: #f0fdf4;
            padding: 12px;
            text-align: center;
            margin-top: 10px;
            margin-bottom: 20px;
          }
          .score-title {
            font-size: 10pt;
            font-weight: bold;
            color: #1e3a8a;
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          .score-value {
            font-size: 24pt;
            font-weight: bold;
            color: #166534;
          }
          .score-status {
            font-size: 11pt;
            font-weight: bold;
            margin-top: 4px;
          }
          .section-title {
            font-size: 11.5pt;
            font-weight: bold;
            color: #ffffff;
            background-color: #1e3a8a;
            padding: 6px 12px;
            margin-top: 20px;
            margin-bottom: 15px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .footer-note {
            margin-top: 30px;
            text-align: center;
            font-size: 9pt;
            color: #9ca3af;
            border-top: 1.5pt solid #e5e7eb;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header-title">Laporan Hasil Evaluasi Computer Based Test (CBT)</div>
        <div class="header-subtitle" style="text-align: center; font-size: 10pt; color: #4b5563; margin-bottom: 18px; border-bottom: 3px double #1e3a8a; padding-bottom: 8px;">Sistem Pengawasan Terintegrasi & Smart Generator Soal</div>
        
        <table class="meta-table">
          <tr>
            <td class="meta-label">Nama Siswa / Peserta</td>
            <td class="meta-value"><strong>${item.studentName}</strong></td>
            <td class="meta-label">ID Transkrip</td>
            <td class="meta-value"><code>${item.id || "N/A"}</code></td>
          </tr>
          <tr>
            <td class="meta-label">Email Terdaftar</td>
            <td class="meta-value">${item.studentEmail}</td>
            <td class="meta-label">Tanggal Ujian</td>
            <td class="meta-value">${formattedDate}</td>
          </tr>
          <tr>
            <td class="meta-label">NISN Siswa</td>
            <td class="meta-value">${item.studentNisn || "-"}</td>
            <td class="meta-label">Durasi Pengerjaan</td>
            <td class="meta-value">${item.durationMinutes} menit</td>
          </tr>
          <tr>
            <td class="meta-label">Paket Soal Ujian</td>
            <td class="meta-value"><strong>${item.examName}</strong></td>
            <td class="meta-label">Batas KKM Kelulusan</td>
            <td class="meta-value">75 / 100</td>
          </tr>
        </table>
        
        <div class="score-box" style="border-color: ${statusColor};">
          <div class="score-title">Nilai Pencapaian Hasil Ujian</div>
          <div class="score-value" style="color: ${statusColor};">${item.score} <span style="font-size: 12pt; color: #6b7280; font-weight: normal;">dari 100</span></div>
          <div class="score-status" style="color: ${statusColor};">STATUS HASIL: ${item.status.toUpperCase()}</div>
        </div>
        
        <div class="section-title">BUKTI RINCIAN BUTIR SOAL DAN JAWABAN SISWA</div>
        
        ${questionsHtml}
        
        <div class="footer-note">
          Laporan ini digenerasi secara resmi oleh platform Sistem CBT Pintar pada ${new Date().toLocaleString("id-ID")}.<br/>
          <em>Lembar ini dilindungi integritas proctoring digital dan aman digunakan untuk dokumentasi akademik.</em>
        </div>
      </body>
      </html>
    `;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.left = "0";
    iframe.style.top = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();
      
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
    }
  };

  const handleManualClearSession = () => {
    if (activeSession) {
      onSetParticipants((prev) => prev.filter((p) => p.id !== activeSession.id));
      try {
        localStorage.removeItem(`cbt_student_answers_${activeSession.id}`);
        localStorage.removeItem(`cbt_student_ragu_${activeSession.id}`);
      } catch (e) {
        console.error(e);
      }
    }
    setActiveSession(null);
    setCurrentStep("login");
  };

  handleSubmitExamRef.current = handleSubmitExam;
  handleTerminateAndShowScoreRef.current = handleTerminateAndShowScore;
  handleManualClearSessionRef.current = handleManualClearSession;

  // Format seconds to readout with high-resolution sub-seconds (.SS)
  const formatTimerSeconds = (totalSeconds: number) => {
    if (totalSeconds <= 0) return "00:00:00.00";
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
    const s = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
    const ms = Math.floor((totalSeconds % 1) * 100).toString().padStart(2, "0");
    return `${h}:${m}:${s}.${ms}`;
  };

  // Locate current question details mapped dynamically
  const activeDetails = getSelectedScheduleDetails();
  const activePkgQuestions = activeDetails ? questions.filter((q) => q.packageId === activeDetails.package?.id) : [];

  // If faked answers because of no created questions
  const getSimulatedActiveQuestion = () => {
    if (!activeSession) return null;
    const isMock = activePkgQuestions.length === 0;

    if (isMock) {
      // Return a dynamically generated mock question text
      return {
        id: `mock-q-${currentQuestionIndex + 1}`,
        questionText: `[Petunjuk Soal Latihan] Ini merupakan butir soal simulasi nomor ${currentQuestionIndex + 1} untuk mata ujian ${activeSession.packageName}. Silakan pilih jawaban yang paling mendekati kebenaran berdasarkan analisis materi terkait.`,
        options: [
          { key: "A" as const, text: "Opsi Solusi Analitik Kompleks Kategori A" },
          { key: "B" as const, text: "Hasil Estimasi Kuantitatif Kategori B (Rekomendasi Utama)" },
          { key: "C" as const, text: "Integrasi Komprehensif Skema Formulasi C" },
          { key: "D" as const, text: "Reduksi Ambigu Variabel Konteks D" },
          { key: "E" as const, text: "Evaluasi Komparatif Data Lapangan E" }
        ]
      };
    }

    return activePkgQuestions[currentQuestionIndex];
  };

  const currentQuestion = getSimulatedActiveQuestion();
  const liveMatch = activeSession ? participants.find((p) => p.id === activeSession.id) : null;
  const isCandidateLocked = liveMatch ? (liveMatch.warningsCount >= 3 || liveMatch.status === "Tidak Aktif") : false;

  return (
    <div ref={containerRef} className="space-y-6 select-none bg-slate-50 min-h-[550px] p-1 rounded-2xl">
      
      {/* HEADER BAR FOR STUDENT CONTEXT */}
      <div className="flex justify-between items-center pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-red-100 text-red-700 rounded-lg">
            <BookOpen size={16} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 font-heading tracking-tight">Portal CBT Siswa</h2>
            <p className="text-[10px] text-slate-500 font-sans">Simulasi Ujian & Seleksi Komputerisasi Mandiri</p>
          </div>
        </div>

        {activeSession && (
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-500 font-mono hidden md:inline">
              PESERTA: <strong className="text-slate-700 uppercase">{activeSession.studentName}</strong>
            </span>
            <button
              onClick={() => setShowExitConfirm(true)}
              className="px-2.5 py-1.5 border border-slate-200 hover:border-red-400 text-slate-500 hover:text-red-700 rounded-lg text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition"
            >
              <LogOut size={12} /> Keluar Sementara
            </button>
          </div>
        )}
      </div>

      {/* RENDER CURRENT RELEVANT STEP VIEW */}

      {/* STEP 1: GENERAL STUDENT PORTAL ENTRANCE */}
      {currentStep === "login" && (
        <div className="max-w-6xl mx-auto py-2 px-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: GUIDELINES, SYSTEM INFOS, FAQ */}
            <div className="lg:col-span-7 space-y-6 animate-fadeIn">
              
              {/* CBT Welcome Hero & Status Indicator */}
              <div className="p-6 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl shadow-md border border-slate-800 space-y-3.5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-pink-500/10 rounded-full blur-xl pointer-events-none"></div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase rounded-full select-none tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Sistem CBT Siap Sedia
                  </span>
                  <span className="px-2.5 py-1 bg-white/10 text-[10px] font-bold text-slate-300 rounded-full select-none tracking-wider">
                    SDN 14 Singkawang
                  </span>
                </div>

                <div className="space-y-1">
                  <h1 className="text-xl md:text-2xl font-black font-heading tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                    Selamat Datang di Portal CBT Siswa 🎓
                  </h1>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    Sistem Computer Based Test modern yang didesain untuk memberikan pengalaman ujian mandiri secara tertib, adil, transparan, dan berintegritas tinggi.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-[11px] text-slate-300">
                  <div className="p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-teal-300">
                      <CheckCircle size={13} />
                      Ujian Mandiri Adil
                    </div>
                    <p className="text-slate-400 leading-normal">Penyusunan butir soal sistematis berdasarkan kurikulum resmi nasional.</p>
                  </div>
                  
                  <div className="p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-pink-300">
                      <Lock size={13} />
                      Keamanan Proctoring
                    </div>
                    <p className="text-slate-400 leading-normal">Deteksi tindakan kecurangan otomatis untuk menjamin keaslian nilai prestasi.</p>
                  </div>
                </div>
              </div>

              {/* Step instructions flowchart visual Card */}
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-5 space-y-4">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5 select-none font-sans">
                  <CheckCircle size={14} className="text-indigo-600" /> Alur Langkah Pelaksanaan Ujian
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-slate-50 rounded-xl space-y-1.5 relative border border-slate-100">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center select-none">1</span>
                    <strong className="text-xs text-slate-800 block leading-tight">Masuk Kredensial</strong>
                    <p className="text-[10px] text-slate-500 leading-relaxed">Verifikasi identitas diri dengan memilih sesi tes yang aktif saat ini.</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl space-y-1.5 relative border border-slate-100">
                    <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-bold text-[10px] flex items-center justify-center select-none">2</span>
                    <strong className="text-xs text-slate-800 block leading-tight">Konfirmasi Briefing</strong>
                    <p className="text-[10px] text-slate-500 leading-relaxed">Pahami syarat pengerjaan, tata tertib kejujuran, serta target kelulusan.</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl space-y-1.5 relative border border-slate-100">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px] flex items-center justify-center select-none">3</span>
                    <strong className="text-xs text-slate-800 block leading-tight">Ujian & Kumpul</strong>
                    <p className="text-[10px] text-slate-500 leading-relaxed">Kerjakan semua lembar pertanyaan dan serahkan sebelum waktu berakhir.</p>
                  </div>
                </div>
              </div>

              {/* Helpful Student FAQ Accordion */}
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-5 space-y-4">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5 select-none font-sans">
                  <HelpCircle size={14} className="text-teal-600" /> Pertanyaan Sering Diajukan (FAQ Siswa)
                </h3>

                <div className="space-y-2">
                  {[
                    {
                      question: "Bagaimana jika koneksi internet saya sempat terputus saat ujian?",
                      answer: "Jangan panik. Jawaban yang Anda klik selalu aman tersimpan di memori peramban secara lokal. Anda bisa menyegarkan halaman atau login kembali ke sesi yang sama setelah jaringan membaik."
                    },
                    {
                      question: "Bolehkah saya membuka tab browser lain atau mencari kunci jawaban online?",
                      answer: "Sangat dilarang! Sistem CBT terintegrasi dengan proteksi 'Lockdown Detection'. Berpindah jendela, mengecilkan browser, atau membuka tab lain sebanyak 3 kali akan mengunci lembar ujian secara paksa."
                    },
                    {
                      question: "Ke mana saya harus melapor jika ujian saya terkunci otomatis?",
                      answer: "Silakan angkat tangan Anda di dalam ruangan dan laporkan langsung ke Guru Pengawas ruangan (proctor). Pengawas akan membantu melakukan pembukaan kunci (reset token status) pada dashboard mereka."
                    }
                  ].map((faq, idx) => {
                    const isOpen = activeFaq === idx;
                    return (
                      <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden transition duration-150">
                        <button
                          type="button"
                          onClick={() => setActiveFaq(isOpen ? null : idx)}
                          className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100/80 transition flex justify-between items-center text-xs font-bold text-slate-700 select-none cursor-pointer"
                        >
                          <span className="leading-snug">{faq.question}</span>
                          <span className={`text-slate-400 transition-transform duration-200 transform ${isOpen ? "rotate-180" : ""}`}>
                            ▼
                          </span>
                        </button>
                        {isOpen && (
                          <div className="px-4 py-3 bg-white text-[11px] border-t border-slate-100 leading-relaxed text-slate-600">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: RE-DESIGNED LOGIN CARD */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fadeIn">
                
                {/* Colorful card header bar info */}
                <div className="bg-gradient-to-tr from-slate-900 via-indigo-950 to-indigo-900 text-white p-6 text-center leading-snug border-b border-slate-800">
                  <span className="inline-block px-3 py-1 bg-red-500/25 text-red-350 text-[10px] font-extrabold uppercase rounded-full mb-2 tracking-widest font-mono border border-red-500/20 shadow-sm">
                    🔒 FORM VALIDASI RESMI
                  </span>
                  <h3 className="font-extrabold text-base tracking-tight uppercase font-heading text-white">MASUK LEMBAR KERJA</h3>
                  <p className="text-[10px] text-slate-300 mt-1 max-w-xs mx-auto leading-relaxed">Harap isi identitas untuk memverifikasi hak keikutsertaan Anda dalam ujian.</p>

                  <div className="mt-4 bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex flex-col items-center justify-center gap-1 shadow-inner">
                    <span className="text-[9px] uppercase text-slate-400 tracking-wider font-extrabold flex items-center gap-1.5 select-none font-sans">
                      <Clock size={11} className="text-indigo-400 animate-pulse" /> WAKTU SERVER (WIB SINKRON)
                    </span>
                    <span className="font-mono text-sm font-black text-indigo-200 tracking-widest bg-black/40 px-3 py-1 rounded-lg">
                      {formatStudentTimeWIB(getSimulatedStudentTime())}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleValidateLogin} className="p-6 space-y-4">
                  
                  {/* Exam Selection - load dynamically */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider flex items-center gap-1">
                      <CheckCircle size={11} className="text-red-500" /> Sesi Ulangan / Ujian Aktif
                    </label>
                    <select
                      value={selectedScheduleId}
                      onChange={(e) => setSelectedScheduleId(e.target.value)}
                      required
                      className="w-full text-xs font-semibold text-slate-700 border border-slate-200 p-3 rounded-xl bg-slate-50 hover:bg-slate-100/50 focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none cursor-pointer transition duration-150"
                    >
                      <option value="">-- Pilih Sesi Ujian Tersedia --</option>
                      {schedules.map((s) => (
                        <option key={s.id} value={s.id} className="text-xs py-1">
                          {s.title} ({s.packageName}) {s.isLocked ? " 🔐 [Terkunci]" : " 🟢 [Terbuka]"}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider flex items-center gap-1">
                      <User size={11} className="text-red-500" /> Nama Lengkap Siswa
                    </label>
                    <div className="relative">
                      <User size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="Masukkan nama lengkap Anda..."
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        className="w-full text-xs pl-9 pr-3.5 py-3 border border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none bg-slate-50 focus:bg-white rounded-xl text-slate-700 font-semibold placeholder:text-slate-400 transition duration-150"
                      />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider font-sans flex items-center gap-1">
                      <Mail size={11} className="text-red-500" /> Alamat Email Siswa
                    </label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
                      <input
                        type="email"
                        required
                        placeholder="Contoh: budi.santoso@gmail.com"
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        className="w-full text-xs pl-9 pr-3.5 py-3 border border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none bg-slate-50 focus:bg-white rounded-xl text-slate-700 font-semibold placeholder:text-slate-400 transition duration-150"
                      />
                    </div>
                  </div>

                  {/* Action Submit Button */}
                  <div className="pt-3 space-y-2.5">
                    <button
                      type="submit"
                      className="w-full py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all duration-150 hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-widest"
                    >
                      🔓 VALIDASI & MASUK BRIGING UTAMA
                    </button>

                    {onGoBack && (
                      <button
                        type="button"
                        onClick={onGoBack}
                        className="w-full py-2.5 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-500 hover:text-slate-700 font-semibold text-xs rounded-xl cursor-pointer transition flex items-center justify-center gap-1"
                      >
                        Kembali ke Halaman Beranda
                      </button>
                    )}
                  </div>
                </form>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* STEP 2: PRE-EXAM BRIEFING & RULES */}
      {currentStep === "briefing" && (() => {
        const details = getSelectedScheduleDetails();
        return (
          <div className="max-w-xl mx-auto py-2">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5 animate-scaleIn">
              <div className="text-center space-y-1.5 pb-4 border-b border-slate-100">
                <Compass className="mx-auto text-red-600 animate-spin" size={32} style={{ animationDuration: "12s" }} />
                <h3 className="font-bold text-slate-800 text-base font-heading">KONSTRIBUSI INTEGRITAS CBT</h3>
                <p className="text-xs text-slate-500">Konfirmasi Lembar Tata Tertib Pengerjaan Ujian Mandiri</p>
              </div>

              {/* Summary target session details */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-xs">
                <h4 className="font-bold text-slate-800">Detail Sesi Seleksi:</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 font-sans text-slate-600">
                  <div>Nama Sesi: <strong className="text-slate-800">{details?.schedule.title}</strong></div>
                  <div>Paket Soal: <strong className="text-slate-800">{details?.schedule.packageName}</strong></div>
                  <div>Target KKM: <strong className="text-red-655 text-red-600 font-extrabold">{details?.schedule.passTargetPercentage}%</strong></div>
                  <div>Batas Durasi: <strong className="text-slate-800">{details?.package?.duration || 120} Menit</strong></div>
                </div>
              </div>

              {/* Interactive guidelines block */}
              <div className="p-3 bg-amber-50 border border-amber-200/50 text-amber-900 rounded-xl text-xs space-y-2 font-medium leading-relaxed">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle size={15} className="text-amber-600 shrink-0" /> TATA TERTIB UTAMA PENGERJAAN:
                </div>
                <ul className="list-disc pl-4 space-y-1 text-amber-800 text-[11px]">
                  <li>Sistem CBT menggunakan <strong>Lockdown Detection</strong> otomatis.</li>
                  <li>Membuka tab baru, meminimalkan browser, atau memindahkan fokus window sebanyak <strong>3 kali otomatis mengunci ujian Anda!</strong></li>
                  <li>Jika terkunci, Anda membutuhkan reset token mandiri oleh Pengawas Utama (Admin Monitor).</li>
                  <li>Waktu terus berjalan meskipun Anda menutup halaman browser.</li>
                </ul>
              </div>

              {/* Agreement checkbox */}
              <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasAgreedRules}
                  onChange={(e) => setHasAgreedRules(e.target.checked)}
                  className="mt-0.5 rounded text-red-600 accent-red-600"
                />
                <span className="leading-snug">
                  Saya menyatakan bahwa saya akan melaksanakan ujian secara jujur, terhormatur, serta berintegritas tanpa kecurangan ataupun bantuan orang lain.
                </span>
              </label>

              {/* Actions footer */}
              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <button
                  onClick={() => setCurrentStep("login")}
                  className="px-3.5 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs"
                >
                  Kembali ke Form Login
                </button>
                <button
                  onClick={handleStartExam}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                >
                  🟢 MEMULAI UJIAN SEKARANG
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* STEP 3: EXAM RUNNING SPACE */}
      {currentStep === "exam" && activeSession && (
        <div className="space-y-4 animate-fadeIn">
          
          {/* TOP COUNTER HEADER BAR FOR SECURITY & TIMERS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-900 text-white p-4 rounded-xl items-center shadow-xs">
            {/* Proctor tracking */}
            <div className="flex items-center gap-2 col-span-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <div className="leading-tight">
                <p className="text-[9px] text-slate-400 font-mono">STATUS SESI:</p>
                <p className="text-[11px] font-bold text-slate-200">PROCTORED LOCKDOWN ACTIVE</p>
              </div>
            </div>

            {/* Title / Info */}
            <div className="text-center col-span-1">
              <h4 className="font-bold text-xs text-red-400 font-heading uppercase truncate">{activeSession.packageName}</h4>
              <p className="text-[9px] text-slate-400 font-mono flex items-center justify-center gap-1">
                <span>Soal {currentQuestionIndex + 1} dari {activeSession.totalQuestions}</span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-emerald-400 font-sans text-[8px] font-bold tracking-widest uppercase">Auto-Save Aktif</span>
              </p>
            </div>

            {/* Live High-Resolution Auto-Save Sync Monitor */}
            <div className="col-span-1 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80 flex items-center gap-2 shadow-inner">
              <div className="relative flex items-center justify-center shrink-0">
                <RefreshCw size={12} className="text-emerald-400 animate-spin" style={{ animationDuration: "1.2s" }} />
                <span className="absolute -top-1 -right-1 flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
              </div>
              <div className="leading-tight select-none">
                <p className="text-[8px] text-slate-400 font-mono font-bold tracking-wide flex items-center gap-1">
                  <span className="text-emerald-400 animate-pulse">SYNCING...</span>
                  <span className="text-slate-600">|</span>
                  <span className="text-emerald-300 font-bold">50Hz (20ms)</span>
                </p>
                <div className="text-[9px] font-mono text-slate-300 flex items-center gap-1.5 leading-none mt-0.5 whitespace-nowrap">
                  <span>S-Save: <strong className="text-white">#{totalSavedTicks}</strong></span>
                  <span className="text-slate-600 font-bold">•</span>
                  <span>Drift: <strong className="text-emerald-400">+{lastSyncDelta ? lastSyncDelta.toFixed(1) : "20.0"}ms</strong></span>
                </div>
              </div>
            </div>

            {/* Monospaced countdown timer */}
            <div className="text-right flex items-center justify-end gap-1.5 font-mono col-span-1">
              <Clock size={14} className="text-red-400" />
              <div className="leading-tight">
                <span className="text-[9px] text-slate-400 block text-right font-sans font-semibold">SISA WAKTU:</span>
                <span className="text-sm font-black text-rose-500 tracking-wider">
                  {formatTimerSeconds(activeSession.timeRemaining)}
                </span>
              </div>
            </div>
          </div>

          {isCandidateLocked ? (
            /* CONDITIONAL RENDER: BLOCKED AND LOCKED CANDIDATE STATE */
            <div className="bg-red-950 border border-red-900 rounded-3xl p-8 text-center space-y-4 max-w-lg mx-auto py-12 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-radial-gradient from-red-650/10 to-transparent pointer-events-none"></div>
              <div className="w-16 h-16 bg-gradient-to-tr from-red-600 to-rose-750 text-white rounded-full flex items-center justify-center mx-auto shadow-lg relative z-10">
                <Lock size={28} className="animate-pulse" />
              </div>
              <h3 className="font-black text-lg text-white font-heading tracking-tight uppercase relative z-10">
                {liveMatch?.status === "Tidak Aktif" ? "⚠️ AKSES UJIAN DINONAKTIFKAN!" : "⚠️ AKSES JAWABAN DIKUNCI!"}
              </h3>
              <p className="text-xs text-slate-200 leading-relaxed max-w-md mx-auto relative z-10 font-medium">
                {liveMatch?.status === "Tidak Aktif" 
                  ? "Guru atau Pengawas ujian telah menonaktifkan akses ujian Anda untuk sesi ini. Silakan berkonsultasi langsung dengan proctor penguji di depan kelas." 
                  : `Sistem CBT Lockdown mendeteksi Anda telah berulang kali keluar dari lembar ujian sebanyak ${liveMatch?.warningsCount || 3} kali.`}
              </p>
              <div className="p-4 bg-slate-900/80 rounded-2xl border border-red-900/60 font-mono text-slate-350 text-[10px] text-left max-w-sm mx-auto space-y-1.5 relative z-10 font-mono">
                <div className="text-rose-400 font-bold">LOG TINDAKAN PROTEKSI:</div>
                {liveMatch?.status === "Tidak Aktif" ? (
                  <>
                    <div>● [STATUS] NONAKTIF (SUSPENDED)</div>
                    <div>● [ADMIN] Dinonaktifkan langsung via Monitor Panel Pengawas</div>
                    <div>● [REQUISITE] Temui Guru Pengawas kelas untuk mengaktifkan kembali</div>
                  </>
                ) : (
                  <>
                    <div>● [CRITICAL] Batas toleransi tab-blur (3 kali) tercapai</div>
                    <div>● [ACTION] Ujian terisolasi & token dinonaktifkan sementara</div>
                    <div>● [SOLUTION] Silakan hubungi proctor atau minta unblock dari dashboard pengawas</div>
                  </>
                )}
              </div>
              <div className="pt-3 flex justify-center gap-3 relative z-10">
                <button
                  type="button"
                  onClick={handleManualClearSession}
                  className="px-5 py-2.5 bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-200 hover:text-white rounded-xl text-xs font-bold cursor-pointer transition duration-150"
                >
                  Keluar dari Sesi Ujian
                </button>
              </div>
            </div>
          ) : (
            /* STANDARD EXAM WORKSPACE */
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
              
              {/* Left col: Question body */}
              <div className="lg:col-span-3 bg-white rounded-xl border border-slate-150 p-5 space-y-5 flex flex-col justify-between shadow-2xs">
                {currentQuestion ? (
                  <div className="space-y-5">
                    {/* Prompt Header */}
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-800 font-mono">SOAL NO. {currentQuestionIndex + 1}</span>
                      <span className="px-2 py-0.5 bg-slate-100 text-[9px] font-mono text-slate-500 rounded">Bobot Nilai Maksimal: 100/100</span>
                    </div>

                    {/* Question text content */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      {renderQuestionText(currentQuestion.questionText)}
                    </div>

                    {/* Radio input options */}
                    <div className="space-y-2.5">
                      {currentQuestion.options.map((opt) => {
                        const isSelected = userAnswers[currentQuestion.id] === opt.key;
                        return (
                          <div
                            key={opt.key}
                            onClick={() => {
                              setUserAnswers((prev) => ({
                                ...prev,
                                [currentQuestion.id]: opt.key
                              }));
                            }}
                            className={`p-3 border rounded-xl flex items-center gap-3 text-xs cursor-pointer transition leading-relaxed shadow-3xs ${
                              isSelected
                                ? "bg-red-50/70 border-red-500 text-red-950 font-bold"
                                : "bg-white border-slate-200 hover:bg-slate-50/50 text-slate-700 font-medium"
                            }`}
                          >
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] border shrink-0 ${
                                isSelected
                                  ? "bg-red-600 text-white border-red-600 shadow-3xs"
                                  : "bg-slate-50 text-slate-500 border-slate-200"
                              }`}
                            >
                              {opt.key}
                            </span>
                            <span>{opt.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    Memuat data pertanyaan...
                  </div>
                )}

                {/* Footer page navigations */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-5 border-t border-slate-100 mt-4">
                  <div className="flex gap-2">
                    <button
                      disabled={currentQuestionIndex === 0}
                      onClick={() => handleUpdateActiveQuestionProgress(currentQuestionIndex - 1)}
                      className="px-3.5 py-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:hover:bg-white"
                    >
                      <ChevronLeft size={14} /> Sebelumnya
                    </button>

                    {currentQuestion && (
                      <label className="flex items-center gap-2 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={raguState[currentQuestion.id] || false}
                          onChange={(e) => {
                            setRaguState((prev) => ({
                              ...prev,
                              [currentQuestion.id]: e.target.checked
                            }));
                          }}
                          className="rounded text-amber-600 accent-amber-500"
                        />
                        <span>Ragu-Ragu</span>
                      </label>
                    )}
                  </div>

                  {currentQuestionIndex < activeSession.totalQuestions - 1 ? (
                    <button
                      onClick={() => handleUpdateActiveQuestionProgress(currentQuestionIndex + 1)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      Berikutnya <ChevronRight size={14} />
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowSubmitConfirm(true)}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer shadow-3xs"
                    >
                      <CheckCircle size={14} /> Kumpulkan Jawaban Ujian
                    </button>
                  )}
                </div>
              </div>

              {/* Right area: Candidate sidebar */}
              <div className="space-y-4">
                
                {/* Visual profile detail */}
                <div className="bg-white rounded-xl border border-slate-150 p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-slate-100 text-slate-600 rounded-full font-bold flex items-center justify-center border border-slate-200 shadow-3xs uppercase shrink-0">
                      {studentName.slice(0, 1) || "S"}
                    </div>
                    <div className="min-w-0 font-sans leading-tight">
                      <p className="font-extrabold text-slate-800 text-xs truncate uppercase">{studentName}</p>
                      <span className="text-[10px] text-emerald-600 font-bold uppercase">Peserta Didik Aktif</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] space-y-1">
                    <div className="flex justify-between text-slate-500">
                      <span>Keluar Tab toleransi:</span>
                      <span className="font-bold text-slate-700">{liveMatch ? `${liveMatch.warningsCount}/3` : "0/3"}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Status Kehadiran:</span>
                      <strong className="text-emerald-600 uppercase">ONLINE IP</strong>
                    </div>
                    <div className="flex justify-between text-slate-500 pt-1 mt-1 border-t border-slate-100">
                      <span>Total progress terjawab:</span>
                      <span className="font-bold text-slate-700">
                        {Object.keys(userAnswers).length} dari {activeSession.totalQuestions} Soal
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dashboard grid mapping questions numbers */}
                <div className="bg-white rounded-xl border border-slate-150 p-4 space-y-3.5 shadow-2xs">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <h5 className="font-bold text-slate-800 text-xs">Peta Navigasi Soal</h5>
                    <span className="text-[9px] text-slate-400 font-mono">Semua Soal</span>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5 justify-center max-h-48 overflow-y-auto pr-1">
                    {Array.from({ length: activeSession.totalQuestions }).map((_, idx) => {
                      // Lookup mock or real question
                      const isReal = activePkgQuestions.length > 0;
                      const qId = isReal ? activePkgQuestions[idx]?.id : `mock-q-${idx + 1}`;
                      const hasAns = !!userAnswers[qId];
                      const isRagu = !!raguState[qId];
                      const isActive = idx === currentQuestionIndex;

                      let cellColor = "bg-slate-100 text-slate-500 hover:bg-slate-200";
                      if (hasAns) {
                        cellColor = isRagu
                          ? "bg-amber-150 bg-amber-400 text-white hover:bg-amber-500"
                          : "bg-emerald-650 bg-emerald-600 text-white hover:bg-emerald-700";
                      } else if (isRagu) {
                        cellColor = "bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200";
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => handleUpdateActiveQuestionProgress(idx)}
                          className={`w-9 h-9 leading-9 rounded-lg font-bold font-mono text-center text-xs transition shrink-0 cursor-pointer ${cellColor} ${
                            isActive ? "ring-2 ring-red-500 ring-offset-1 font-extrabold" : ""
                          }`}
                        >
                          {(idx + 1).toString().padStart(2, "0")}
                        </button>
                      );
                    })}
                  </div>

                  {/* Legend guide info */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-x-3 gap-y-1.5 text-[9px] font-medium text-slate-400 tracking-wide font-sans justify-between">
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded bg-emerald-600 block shadow-3xs"></span>
                      <span>Sudah Dijawab</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded bg-amber-400 block shadow-3xs"></span>
                      <span>Ragu-Ragu</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded bg-slate-100 border border-slate-200 block"></span>
                      <span>Kosong</span>
                    </div>
                  </div>
                </div>

                {/* Secure Proctored Lock Note card */}
                <div className="bg-slate-900 text-slate-300 rounded-xl p-3 text-[10px] leading-relaxed font-mono shadow-xs border border-slate-800 flex items-center gap-2">
                  <ShieldAlert size={14} className="text-rose-500 shrink-0 animate-pulse" />
                  <span>Sistem proteksi aktif memonitor click, tab, focus. Dilarang berbuat curang!</span>
                </div>

              </div>

            </div>
          )}

        </div>
      )}

      {/* STEP 4: SCORE DISPLAY & FINAL GRADUATION CERTIFICATE */}
      {currentStep === "score" && endedExamResult && (
        <div className="max-w-xl mx-auto py-2 space-y-6">
          
          {/* Certificate visual scorecard block */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm text-center space-y-5 animate-scaleIn">
            
            {/* Logo/Icon success header */}
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto shadow-xs ${
              endedExamResult.status === "Lulus" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
            }`}>
              <Award size={28} />
            </div>

            <div className="space-y-1">
              <span className="inline-block text-[10px] font-mono tracking-widest text-slate-400 block uppercase font-bold">UJIAN CBT SELESAI DISUBMITE</span>
              <h3 className="font-extrabold text-slate-800 text-base font-heading">RINGKASAN HASIL EVALUASI</h3>
              <p className="text-xs text-slate-500 font-sans max-w-sm mx-auto leading-relaxed">
                Jawaban Anda telah dinilai oleh motor pengolah nilai otomatis. Detail skor tercatat di pangkalan riwayat asisten.
              </p>
            </div>

            {/* Scorecard block details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-center">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-[10px] text-slate-400 block uppercase font-sans">Kerapihan Skor</span>
                <span className="text-xl font-black text-slate-800">{endedExamResult.score}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-[10px] text-slate-400 block uppercase font-sans">Benar</span>
                <span className="text-xl font-black text-emerald-600">{endedExamResult.correctCount}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-[10px] text-slate-400 block uppercase font-sans">Salah</span>
                <span className="text-xl font-black text-rose-600">{endedExamResult.wrongCount}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-[10px] text-slate-400 block uppercase font-sans">Kelulusan (KKM {endedExamResult.kkm})</span>
                <span className={`text-xs font-bold block mt-1 uppercase ${
                  endedExamResult.status === "Lulus" ? "text-emerald-700" : "text-amber-700"
                }`}>
                  {endedExamResult.status}
                </span>
              </div>
            </div>

            {/* IF COMPLETED SUCCESSFULLY, SHOW REAL-TIME PASSING ANNOUNCEMENT NO CERTIFICATES */}
            {endedExamResult.status === "Lulus" ? (
              <div className="border border-emerald-200 bg-emerald-50/40 p-5 rounded-2xl text-center space-y-3 animate-fadeIn relative overflow-hidden">
                <span className="inline-block text-[10px] font-mono tracking-widest text-emerald-600 font-extrabold block">PEMBERITAHUAN HASIL SELEKSI</span>
                
                <div className="space-y-1">
                  <h4 className="text-xs text-slate-400 font-medium">Selamat Kepada</h4>
                  <h2 className="text-base font-black font-heading text-slate-800 uppercase max-w-xs mx-auto">
                    {endedExamResult.studentName}
                  </h2>
                </div>

                <p className="text-[11px] text-slate-600 max-w-sm mx-auto leading-relaxed">
                  Anda dinyatakan <strong className="text-emerald-750 text-emerald-750">LULUS</strong> dalam ujian <span className="font-bold text-slate-800 uppercase">{endedExamResult.examName}</span> dengan perolehan skor akhir sebesar <strong>{endedExamResult.score} / {endedExamResult.maxScore}</strong>.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-amber-50/50 border border-amber-150 rounded-xl text-center space-y-2 max-w-sm mx-auto">
                <p className="text-xs text-amber-900 font-semibold leading-relaxed">
                  Batas Kelulusan (KKM) untuk sesi ini adalah <strong>{endedExamResult.kkm}%</strong>. 
                  Anda memerlukan perbaikan nilai remedial. Semangat dan mari coba kembali!
                </p>
              </div>
            )}

            {/* Download & Print operations for student */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <span className="block text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">DOKUMENTASI JAWABAN ANDA</span>
              <p className="text-[10px] text-slate-500 max-w-sm mx-auto leading-relaxed">
                Anda dapat melihat rincian butir soal, kunci jawaban resmi, dan pilihan jawaban yang Anda kumpulkan saat ujian dalam bentuk dokumen A4 yang disusun rapi.
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
                <button
                  type="button"
                  onClick={() => setPreviewResult(endedExamResult)}
                  className="px-3 py-2 bg-white border border-slate-200 hover:border-blue-300 text-blue-700 hover:text-blue-800 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer shadow-3xs"
                >
                  <Eye size={14} /> Pratinjau Lembar A4
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadDocx(endedExamResult)}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer shadow-3xs"
                >
                  <Download size={14} /> Unduh Jawaban (DOCX)
                </button>
                <button
                  type="button"
                  onClick={() => handlePrintDocument(endedExamResult)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer border border-slate-200 shadow-3xs"
                >
                  <Printer size={14} /> Cetak Langsung
                </button>
              </div>
            </div>

            {/* Interactive Answer Sheet Review on Page */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-left bg-white shadow-3xs">
              <button
                type="button"
                onClick={() => setShowAnswerSheetReview(!showAnswerSheetReview)}
                className="w-full flex items-center justify-between p-3.5 bg-slate-50 border-b border-slate-100 hover:bg-slate-100/70 transition cursor-pointer"
              >
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 font-sans">
                  <CheckCircle size={15} className="text-blue-605 text-blue-600" />
                  {showAnswerSheetReview ? "Sembunyikan" : "Tampilkan"} Lembar Jawaban & Pembahasan ({getHistoryQuestions(endedExamResult).length} Soal)
                </span>
                <span className="text-xs text-blue-600 font-semibold font-mono">
                  {showAnswerSheetReview ? "Tutup ▲" : "Buka ▼"}
                </span>
              </button>

              {showAnswerSheetReview && (
                <div className="p-4 space-y-4 max-h-[450px] overflow-y-auto divide-y divide-slate-100">
                  {getHistoryQuestions(endedExamResult).map((q, qIndex) => {
                    const studentAns = endedExamResult.answers ? endedExamResult.answers[q.id] : undefined;
                    const isCorrect = studentAns === q.correctAnswer;
                    const hasAnswered = !!studentAns;

                    return (
                      <div key={q.id} className={`${qIndex > 0 ? "pt-4" : ""} first:pt-0`}>
                        <div className="flex justify-between items-start gap-4">
                          <span className="text-xs font-bold text-slate-800 leading-normal font-sans">
                            <span className="text-blue-600 mr-1 font-mono">Soal {qIndex + 1}.</span> {q.questionText}
                          </span>
                          <span className="shrink-0">
                            {hasAnswered ? (
                              isCorrect ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[9px] font-bold font-sans">
                                  Benar ✓
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded text-[9px] font-bold font-sans">
                                  Salah ✗
                                </span>
                              )
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded text-[9px] font-bold font-sans">
                                Kosong -
                              </span>
                            )}
                          </span>
                        </div>

                        {/* Options */}
                        <div className="mt-2.5 pl-4 space-y-1">
                          {q.options.map((opt) => {
                            const isOptionCorrect = opt.key === q.correctAnswer;
                            const isOptionSelectedByStudent = opt.key === studentAns;

                            let bgClass = "bg-transparent border-transparent text-slate-600";
                            let iconSuffix = null;

                            if (isOptionCorrect) {
                              bgClass = "bg-emerald-50/70 text-emerald-800 border-emerald-150 font-semibold";
                              iconSuffix = <span className="ml-1 text-[9px] text-emerald-600 font-mono italic">[Kunci Jawaban]</span>;
                            }

                            if (hasAnswered && isOptionSelectedByStudent) {
                              if (isCorrect) {
                                bgClass = "bg-emerald-100/90 text-emerald-900 border-emerald-200 font-bold shadow-3xs";
                                iconSuffix = <span className="ml-1 text-[9px] text-emerald-700 font-mono italic font-bold">✓ Jawaban Anda (Benar)</span>;
                              } else {
                                bgClass = "bg-rose-100/90 text-rose-900 border-rose-200 font-bold shadow-3xs";
                                iconSuffix = <span className="ml-1 text-[9px] text-rose-700 font-mono italic font-bold">✗ Jawaban Anda (Salah)</span>;
                              }
                            }

                            return (
                              <div
                                key={opt.key}
                                className={`text-[11px] py-1 px-2 border rounded-lg flex items-start gap-2 ${bgClass}`}
                              >
                                <span className="font-bold shrink-0">{opt.key}.</span>
                                <span className="leading-normal">{opt.text} {iconSuffix}</span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Explanation */}
                        {q.explanation && (
                          <div className="mt-2 pl-3 border-l-2 border-slate-300 py-1 text-[10px] text-slate-500 italic font-sans">
                            <strong className="text-slate-600 font-semibold not-italic">Pembahasan:</strong> {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Exit logic triggers */}
            <div className="pt-3 border-t border-slate-100 flex justify-center gap-3">
              <button
                type="button"
                onClick={handleManualClearSession}
                className="px-4 py-2 bg-slate-920 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                Kembali ke Menu Utama
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal Popup - Student A4 Print Preview */}
      {previewResult && (() => {
        const pkgQuestions = getHistoryQuestions(previewResult);
        const statusColor = previewResult.status === "Lulus" ? "#166534" : (previewResult.status === "Remedial" ? "#b45309" : "#991b1b");
        const statusBg = previewResult.status === "Lulus" ? "#f0fdf4" : (previewResult.status === "Remedial" ? "#fffbeb" : "#fef2f2");

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn font-sans">
            <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 max-w-5xl w-full h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-scaleIn">
              {/* Toolbar */}
              <div className="bg-slate-800 border-b border-slate-700 px-5 py-3 flex flex-wrap items-center justify-between gap-4 shrink-0">
                <div className="space-y-0.5 text-left">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-blue-600/35 border border-blue-500/20 text-blue-300 rounded text-[9px] font-mono font-bold uppercase tracking-wider">
                      Pratinjau Cetak Siswa (A4 WYSIWYG)
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">ID: {previewResult.id || "N/A"}</span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                    <Eye size={16} className="text-blue-400" />
                    Lembar Laporan Hasil Ujian &mdash; {previewResult.studentName}
                  </h3>
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center gap-2.5 bg-slate-950/40 p-1.5 rounded-lg border border-slate-700/60">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
                    disabled={zoomLevel <= 50}
                    className="p-1 hover:bg-slate-850 rounded text-slate-400 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer"
                    title="Perkecil Hambatan (Zoom Out)"
                  >
                    <ZoomOut size={14} />
                  </button>
                  <span className="text-xs font-mono font-bold text-slate-300 w-12 text-center select-none">
                    {zoomLevel}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
                    disabled={zoomLevel >= 150}
                    className="p-1 hover:bg-slate-850 rounded text-slate-400 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer"
                    title="Perbesar Hambatan (Zoom In)"
                  >
                    <ZoomIn size={14} />
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePrintDocument(previewResult)}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition duration-150 flex items-center gap-1.5 cursor-pointer border border-blue-550/20 shadow-sm"
                  >
                    <Printer size={13} /> Cetak (A4)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadDocx(previewResult)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition duration-150 flex items-center gap-1.5 cursor-pointer border border-emerald-550/20 shadow-sm"
                  >
                    <Download size={13} /> Unduh DOCX
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewResult(null)}
                    className="p-1.5 bg-slate-700 hover:bg-slate-650 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
                  >
                    <XCircle size={18} />
                  </button>
                </div>
              </div>

              {/* Viewport page container */}
              <div className="flex-1 overflow-auto bg-slate-950/80 p-8 flex justify-center items-start select-text shadow-inner">
                <div 
                  className="py-6 flex justify-center animate-fadeIn" 
                  style={{ 
                    width: '210mm', 
                    height: `${297 * (zoomLevel / 100)}mm` 
                  }}
                >
                  <div 
                    className="origin-top transition-transform duration-200" 
                    style={{ transform: `scale(${zoomLevel / 100})` }}
                  >
                    {/* Simulated A4 Paper */}
                    <div className="w-[210mm] min-h-[297mm] p-[20mm] bg-white text-slate-900 shadow-2xl relative border border-slate-200 text-left font-sans leading-normal">
                      {/* Paper Content Header */}
                      <div className="text-center font-bold font-sans text-[16.5pt] text-blue-900 uppercase">
                        Laporan Hasil Evaluasi Computer Based Test (CBT)
                      </div>
                      <div className="text-center font-sans text-[10pt] text-slate-500 border-b-[3px] border-double border-blue-900 pb-2 mb-5">
                        Sistem Pengawasan Terintegrasi &amp; Smart Generator Soal
                      </div>

                      {/* Paper Content Metadata */}
                      <table className="w-full mb-4 border-collapse font-sans text-left">
                        <tbody>
                          <tr className="align-top">
                            <td className="w-[145px] p-1.5 text-[10.5pt] font-sans font-bold text-slate-500">
                              Nama Siswa / Peserta
                            </td>
                            <td className="p-1.5 text-[10.5pt] font-sans font-bold border-b border-slate-200 text-slate-900">
                              {previewResult.studentName}
                            </td>
                            <td className="w-[145px] p-1.5 text-[10.5pt] font-sans font-bold text-slate-500 pl-4">
                              ID Transkrip
                            </td>
                            <td className="p-1.5 text-[10.5pt] font-sans border-b border-slate-200 text-slate-800 font-mono">
                              {previewResult.id || "N/A"}
                            </td>
                          </tr>
                          <tr className="align-top">
                            <td className="w-[145px] p-1.5 text-[10.5pt] font-sans font-bold text-slate-500">
                              Email Terdaftar
                            </td>
                            <td className="p-1.5 text-[10.5pt] font-sans border-b border-slate-200 text-slate-800">
                              {previewResult.studentEmail}
                            </td>
                            <td className="w-[145px] p-1.5 text-[10.5pt] font-sans font-bold text-slate-500 pl-4">
                              Tanggal Ujian
                            </td>
                            <td className="p-1.5 text-[10.5pt] font-sans border-b border-slate-200 text-slate-800">
                              {previewResult.startTime || "-"}
                            </td>
                          </tr>
                          <tr className="align-top">
                            <td className="w-[145px] p-1.5 text-[10.5pt] font-sans font-bold text-slate-500">
                              NISN Siswa
                            </td>
                            <td className="p-1.5 text-[10.5pt] font-sans border-b border-slate-200 text-slate-800">
                              {previewResult.studentNisn || "-"}
                            </td>
                            <td className="w-[145px] p-1.5 text-[10.5pt] font-sans font-bold text-slate-500 pl-4">
                              Durasi Pengerjaan
                            </td>
                            <td className="p-1.5 text-[10.5pt] font-sans border-b border-slate-200 text-slate-800">
                              {previewResult.durationMinutes} menit
                            </td>
                          </tr>
                          <tr className="align-top">
                            <td className="w-[145px] p-1.5 text-[10.5pt] font-sans font-bold text-slate-500">
                              Paket Soal Ujian
                            </td>
                            <td className="p-1.5 text-[10.5pt] font-sans font-bold border-b border-slate-200 text-slate-900">
                              {previewResult.examName}
                            </td>
                            <td className="w-[145px] p-1.5 text-[10.5pt] font-sans font-bold text-slate-500 pl-4">
                              Batas KKM Kelulusan
                            </td>
                            <td className="p-1.5 text-[10.5pt] font-sans border-b border-slate-200 text-slate-900 font-bold">
                              {previewResult.kkm} / 100
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Score Box */}
                      <div 
                        className="p-3 text-center my-4 border-[1.5pt] rounded"
                        style={{ borderColor: statusColor, backgroundColor: statusBg }}
                      >
                        <div className="text-[10pt] font-bold text-blue-900 uppercase tracking-wide mb-0.5">
                          Nilai Pencapaian Hasil Ujian
                        </div>
                        <div className="text-[24pt] font-bold font-heading" style={{ color: statusColor }}>
                          {previewResult.score} <span className="text-[12pt] text-slate-500 font-normal">dari 100</span>
                        </div>
                        <div className="text-[11pt] font-bold mt-0.5" style={{ color: statusColor }}>
                          STATUS HASIL: {previewResult.status.toUpperCase()}
                        </div>
                      </div>

                      {/* Evidence Section Title */}
                      <div className="text-[11.5pt] font-bold text-white bg-[#1e3a8a] px-3 py-1.5 my-4 uppercase tracking-wider rounded-xs">
                        BUKTI RINCIAN BUTIR SOAL DAN JAWABAN SISWA
                      </div>

                      {/* Detail Questions list */}
                      <div className="space-y-4 text-left font-sans">
                        {pkgQuestions.length === 0 ? (
                          <div className="text-center py-6 text-slate-400 italic text-[11pt]">
                            Tidak ada data butir soal riil yang terekam di dalam sistem untuk paket ini. Format transkrip rekapitulasi nilai ditampilkan.
                          </div>
                        ) : (
                          pkgQuestions.map((q, qIndex) => {
                            const studentAns = previewResult.answers ? previewResult.answers[q.id] : undefined;
                            const isCorrect = studentAns === q.correctAnswer;
                            const hasAnswered = !!studentAns;

                            return (
                              <div key={q.id} className="pb-3 border-b border-dashed border-slate-200 break-inside-avoid">
                                <div className="text-[11pt] font-bold mb-2 flex justify-between items-start gap-4">
                                  <div className="text-slate-800 leading-normal">
                                    <span className="text-blue-900 mr-1">Soal {qIndex + 1}.</span> {q.questionText}
                                  </div>
                                  <div className="shrink-0 text-right mt-0.5">
                                    {hasAnswered ? (
                                      isCorrect ? (
                                        <span className="text-emerald-700 font-bold text-[10pt] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-sans">[BENAR ✓]</span>
                                      ) : (
                                        <span className="text-rose-700 font-bold text-[10pt] bg-rose-50 px-2 py-0.5 rounded border border-rose-100 font-sans">[SALAH ✗]</span>
                                      )
                                    ) : (
                                      <span className="text-amber-700 font-bold text-[10pt] bg-amber-50 px-2 py-0.5 rounded border border-amber-100 font-sans">[BELUM DIJAWAB]</span>
                                    )}
                                  </div>
                                </div>

                                <div className="pl-4 space-y-1 mt-1 font-sans">
                                  {q.options.map((opt) => {
                                    const isOptionCorrect = opt.key === q.correctAnswer;
                                    const isOptionSelectedByStudent = opt.key === studentAns;

                                    let bgVal = "transparent";
                                    let colVal = "#4b5563";
                                    let fontW = "normal";
                                    let suffix = "";

                                    if (isOptionCorrect) {
                                      colVal = "#166534";
                                      fontW = "bold";
                                      suffix = " [KUNCI JAWABAN]";
                                    }

                                    if (hasAnswered && isOptionSelectedByStudent) {
                                      if (isCorrect) {
                                        bgVal = "#d1fae5";
                                        colVal = "#166534";
                                        fontW = "bold";
                                        suffix = " (✓ Jawaban Anda - BENAR)";
                                      } else {
                                        bgVal = "#fee2e2";
                                        colVal = "#991b1b";
                                        fontW = "bold";
                                        suffix = " (✗ Jawaban Anda - SALAH)";
                                      }
                                    }

                                    return (
                                      <div 
                                        key={opt.key} 
                                        className="text-[11pt] py-0.5 px-2 rounded flex items-start gap-2.5"
                                        style={{ backgroundColor: bgVal, color: colVal, fontWeight: fontW }}
                                      >
                                        <span className="font-bold shrink-0">{opt.key}.</span>
                                        <span className="leading-snug">{opt.text}{suffix}</span>
                                      </div>
                                    );
                                  })}
                                </div>

                                {q.explanation && (
                                  <div className="mt-2.5 p-2 bg-[#f9fafb] border-l-[3px] border-slate-400 text-[10pt] text-slate-500 italic rounded-r leading-relaxed font-sans text-left">
                                    <strong>Pembahasan:</strong> {q.explanation}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Paper content footer */}
                      <div className="mt-8 text-center text-[9pt] text-slate-400 border-t border-slate-100 pt-3 leading-relaxed font-sans">
                        Laporan ini digenerasi secara resmi oleh platform Sistem CBT Pintar pada {new Date().toLocaleString("id-ID")}.<br />
                        <span className="italic">Lembar ini dilindungi integritas proctoring digital dan aman digunakan untuk dokumentasi akademik.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* DETECTED FOCUS LOSS CHEATING ALARM - OVERLAY POPUP */}
      {isCheatWarningVisible && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[99]" style={{ animationDuration: "100ms" }}>
          <div className="bg-white rounded-2xl border border-red-200 max-w-sm w-full p-6 text-center space-y-4 shadow-xl animate-scaleIn">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <ShieldAlert size={24} />
            </div>

            <div className="space-y-1.5">
              <h4 className="font-extrabold text-slate-800 text-sm tracking-tight uppercase font-heading text-red-655">⚠️ DETEKSI DETEKTOR JENDELA!</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-sans font-medium">
                Pencatatan Lockdown Mendeteksi kursor Anda meninggalkan lembar browser CBT atau mengganti halaman tab!
              </p>
            </div>

            <div className="p-3 bg-red-50 text-red-900 border border-red-100 rounded-xl font-mono text-[10px] text-center uppercase font-bold">
              Pelanggaran ini dilaporkan langsung ke Dashboard Pengawas!
            </div>

            <button
              onClick={() => {
                setIsCheatWarningVisible(false);
                // Attempt to request focus
                window.focus();
              }}
              className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl cursor-pointer transition shadow-xs"
            >
              Saya Mengerti & Kembali Ujian
            </button>
          </div>
        </div>
      )}

      {/* CONFIRMATION OVERLAYS */}

      {/* EXIT TEMPORARY CONFIRM */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-xl border border-slate-200 p-5 max-w-sm w-full space-y-4 shadow-lg text-center">
            <h4 className="font-bold text-slate-800 text-sm font-heading">Keluar Sementara dari Ujian?</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              Anda akan kembali ke Admin Panel sementara waktu. <strong>Waktu hitungan mundur Anda terus berjalan</strong> di background. Apakah Anda yakin?
            </p>
            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-1.5 bg-slate-100 text-slate-700 rounded text-xs font-semibold cursor-pointer"
              >
                Kembali Pengerjaan
              </button>
              <button
                onClick={() => {
                  setShowExitConfirm(false);
                  // Back to parent dashboard step or portal main
                  setCurrentStep("login");
                }}
                className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold cursor-pointer transition"
              >
                Ya, Keluar Sementara
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEST COLLECT CONFIRM */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-xl border border-slate-200 p-5 max-w-sm w-full space-y-4 shadow-lg text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-center font-bold">
              ✓
            </div>
            <h4 className="font-bold text-slate-800 text-sm font-heading">Yakin Ingin Mengumpulkan Ujian?</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              Tindakan ini tidak dapat dibatalkan. Seluruh jawaban Anda akan langsung dihitung nilai persentasenya sekarang.
            </p>
            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 py-1.5 bg-slate-100 text-slate-700 rounded text-xs font-semibold cursor-pointer"
              >
                Periksa Ulang Jawaban
              </button>
              <button
                onClick={() => handleSubmitExam()}
                className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold cursor-pointer transition"
              >
                Kumpulkan &Selesai
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
