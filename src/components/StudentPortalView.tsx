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
  Compass
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

  // Dynamic ticking student UTC clock using the synced manual server UTC offset
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

  const formatStudentTimeUTC = (timestamp: number) => {
    const d = new Date(timestamp);
    const yr = d.getUTCFullYear();
    const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dy = String(d.getUTCDate()).padStart(2, "0");
    const hr = String(d.getUTCHours()).padStart(2, "0");
    const mn = String(d.getUTCMinutes()).padStart(2, "0");
    const sc = String(d.getUTCSeconds()).padStart(2, "0");
    return `${yr}-${mo}-${dy} ${hr}:${mn}:${sc}`;
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
    studentName: string;
    studentEmail: string;
    examName: string;
    score: number;
    maxScore: number;
    correctCount: number;
    wrongCount: number;
    unansweredCount: number;
    status: "Lulus" | "Gagal" | "Remedial";
    durationMinutes: number;
    kkm: number;
  } | null>(null);

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
      studentName: historyRecord.studentName,
      studentEmail: historyRecord.studentEmail,
      examName: historyRecord.examName,
      score: historyRecord.score,
      maxScore: historyRecord.maxScore,
      correctCount: Math.round((historyRecord.score / historyRecord.maxScore) * activeSession!.totalQuestions),
      wrongCount:
        activeSession!.totalQuestions - Math.round((historyRecord.score / historyRecord.maxScore) * activeSession!.totalQuestions),
      unansweredCount: 0,
      status: historyRecord.status,
      durationMinutes: historyRecord.durationMinutes,
      kkm: activeSession?.kkm || 75
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
      examName: activeSession.packageName,
      score: score,
      maxScore: 100,
      status: status,
      startTime: new Date(Date.now() + (serverTimeConfig?.offsetMs || 0)).toISOString().replace("T", " ").slice(0, 16),
      durationMinutes: durationUsedMinutes
    };

    // 1. Save globally
    onAddHistory(completedRecord);

    // 2. Remove from live participant metrics
    onSetParticipants((prev) => prev.filter((p) => p.id !== activeSession.id));

    // 3. Store result locally for score breakdown screen
    setEndedExamResult({
      studentName: activeSession.studentName,
      studentEmail: activeSession.studentEmail,
      examName: activeSession.packageName,
      score: score,
      maxScore: 100,
      correctCount: correct,
      wrongCount: wrong,
      unansweredCount: unanswered,
      status: status,
      durationMinutes: durationUsedMinutes,
      kkm: activeSession.kkm
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

      {/* STEP 1: LOGIN FORM */}
      {currentStep === "login" && (
        <div className="max-w-md mx-auto py-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fadeIn">
            {/* Colorful layout header bar info */}
            <div className="bg-gradient-to-r from-teal-500 via-purple-500 to-pink-500 text-white p-5 text-center leading-snug">
              <span className="inline-block px-2.5 py-0.5 bg-white/20 text-[9px] font-bold uppercase rounded-full mb-2 tracking-widest font-mono border border-white/20">
                CBT LEMBAR JAWABAN SISWA
              </span>
              <h3 className="font-extrabold text-sm tracking-wide uppercase font-heading">Verifikasi Identitas Peserta</h3>
              <p className="text-[10px] text-white/90 mt-1">Harap isi kredensial lengkap siswa untuk memulai sesi ujian.</p>

              <div className="mt-3.5 bg-black/25 backdrop-blur-md rounded-xl p-2 font-mono text-[10px] text-teal-200 border border-white/10 flex flex-col items-center justify-center gap-0.5 shadow-inner">
                <span className="text-[9px] uppercase text-white/60 tracking-wider font-extrabold flex items-center gap-1">
                  🌐 WAKTU SERVER UTC {serverTimeConfig?.useManualTime ? "(OVERRIDE MANUAL)" : ""}
                </span>
                <span className="font-black text-xs text-white tracking-widest">
                  {formatStudentTimeUTC(getSimulatedStudentTime())}
                </span>
              </div>
            </div>

            <form onSubmit={handleValidateLogin} className="p-5 space-y-4">
              {/* Exam Selection - load dynamically */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">SESI ULANGAN / UJIAN AKTIF *</label>
                <select
                  value={selectedScheduleId}
                  onChange={(e) => setSelectedScheduleId(e.target.value)}
                  required
                  className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-slate-50 outline-none focus:border-red-500 cursor-pointer text-slate-700 font-semibold"
                >
                  <option value="">-- Pilih Sesi Ujian Tersedia --</option>
                  {schedules.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.packageName}) {s.isLocked ? " (🔐 Terkunci)" : " (🟢 Terbuka)"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">NAMA LENGKAP SISWA *</label>
                <div className="relative">
                  <User size={13} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-2.5 border border-slate-200 focus:border-red-500 outline-none bg-slate-50 rounded-lg text-slate-700 font-medium"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider font-sans">ALAMAT EMAIL VERIFIKASI *</label>
                <div className="relative">
                  <Mail size={13} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="Contoh: budi.santoso@gmail.com"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-2.5 border border-slate-200 focus:border-red-500 outline-none bg-slate-50 rounded-lg text-slate-700 font-medium"
                  />
                </div>
              </div>

              {/* Action Submit */}
              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-red-650 hover:bg-red-700 bg-red-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition flex items-center justify-center gap-1.5 uppercase tracking-wide"
                >
                  🔓 Validasi & Masuk Portal briefing
                </button>

                {onGoBack && (
                  <button
                    type="button"
                    onClick={onGoBack}
                    className="w-full py-2.5 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-500 hover:text-slate-700 font-semibold text-xs rounded-xl cursor-pointer transition flex items-center justify-center gap-1"
                  >
                    Kembali ke Beranda Gate
                  </button>
                )}
              </div>
            </form>
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

            {/* Exit logic triggers */}
            <div className="pt-3 border-t border-slate-100 flex justify-center gap-3">
              <button
                onClick={handleManualClearSession}
                className="px-4 py-2 bg-slate-920 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                Kembali ke Menu Utama
              </button>
            </div>

          </div>
        </div>
      )}

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
