/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Laptop,
  Home,
  Box,
  Megaphone,
  Clock,
  Radio,
  FileText,
  Folder,
  Users,
  Bell,
  ChevronDown,
  Menu,
  X,
  Sparkles,
  Zap,
  Power,
  BookOpen,
  ShieldAlert,
  AlertTriangle,
  UserCheck
} from "lucide-react";

// Local imports
import {
  ExamPackage,
  Question,
  SystemUpdate,
  ExamHistory,
  LiveParticipant,
  ExamSchedule,
  UserAccount,
  ServerTimeConfig
} from "./types";

import {
  INITIAL_PACKAGES,
  INITIAL_QUESTIONS,
  INITIAL_UPDATES,
  INITIAL_HISTORY,
  INITIAL_PARTICIPANTS,
  INITIAL_SCHEDULES,
  INITIAL_ACCOUNTS
} from "./data";

// Component imports
import DashboardView from "./components/DashboardView";
import PackagesView from "./components/PackagesView";
import AnnouncementsView from "./components/AnnouncementsView";
import HistoryView from "./components/HistoryView";
import MonitorView from "./components/MonitorView";
import SchedulesView from "./components/SchedulesView";
import QuestionsView from "./components/QuestionsView";
import AccountsView from "./components/AccountsView";
import StudentPortalView from "./components/StudentPortalView";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("Dashboard");
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Portal & Role states (Separate Admin & Student Portal)
  const [userRole, setUserRole] = useState<"admin" | "student" | null>(() => {
    return localStorage.getItem("cbt_user_role") as "admin" | "student" | null;
  });
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Core Persistent States
  const [packages, setPackages] = useState<ExamPackage[]>(() => {
    const saved = localStorage.getItem("cbt_packages");
    return saved ? JSON.parse(saved) : INITIAL_PACKAGES;
  });

  const [questions, setQuestions] = useState<Question[]>(() => {
    const saved = localStorage.getItem("cbt_questions");
    return saved ? JSON.parse(saved) : INITIAL_QUESTIONS;
  });

  const [updates, setUpdates] = useState<SystemUpdate[]>(() => {
    const saved = localStorage.getItem("cbt_updates");
    return saved ? JSON.parse(saved) : INITIAL_UPDATES;
  });

  const [history, setHistory] = useState<ExamHistory[]>(() => {
    const saved = localStorage.getItem("cbt_history");
    return saved ? JSON.parse(saved) : INITIAL_HISTORY;
  });

  const [participants, setParticipants] = useState<LiveParticipant[]>(() => {
    const saved = localStorage.getItem("cbt_participants");
    return saved ? JSON.parse(saved) : INITIAL_PARTICIPANTS;
  });

  const [schedules, setSchedules] = useState<ExamSchedule[]>(() => {
    const saved = localStorage.getItem("cbt_schedules");
    return saved ? JSON.parse(saved) : INITIAL_SCHEDULES;
  });

  const [accounts, setAccounts] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem("cbt_accounts");
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
  });

  const [serverTimeConfig, setServerTimeConfig] = useState<ServerTimeConfig>(() => {
    const saved = localStorage.getItem("cbt_server_time_config");
    return saved ? JSON.parse(saved) : { useManualTime: false, offsetMs: 0 };
  });

  const [showNotificationPopup, setShowNotificationPopup] = useState(false);

  // Interfaces & states for Live Integrity Proctor Alerts
  interface AdminAlertToast {
    id: string;
    participantId: string;
    name: string;
    status: "Mencurigakan" | "Tidak Aktif" | "Login_Baru";
    examName: string;
    message: string;
    timestamp: string;
    ipAddress?: string;
  }

  const [toastAlerts, setToastAlerts] = useState<AdminAlertToast[]>([]);
  const seenStatusesRef = useRef<Record<string, string>>({});
  const isLoadedRef = useRef(false);

  // One-time automatic cleanup to make sure existing users start with empty/reset statistics and no mock list items
  useEffect(() => {
    const isResetDone = localStorage.getItem("cbt_reset_history_v2026");
    if (!isResetDone) {
      localStorage.setItem("cbt_history", JSON.stringify([]));
      localStorage.setItem("cbt_participants", JSON.stringify([]));
      setHistory([]);
      setParticipants([]);
      localStorage.setItem("cbt_reset_history_v2026", "true");
    }
  }, []);

  // Populate seenStatusesRef once on mount with current states to avoid immediate alerts for pre-existing records on page load
  useEffect(() => {
    const initialSeen: Record<string, string> = {};
    participants.forEach((p) => {
      initialSeen[p.id] = p.status;
    });
    seenStatusesRef.current = initialSeen;
    
    // Set isLoaded after first tick to avoid triggering alerts on page load
    const t = setTimeout(() => {
      isLoadedRef.current = true;
    }, 100);
    return () => clearTimeout(t);
  }, []);

  // Monitor participants in real-time for warning conditions
  useEffect(() => {
    const nextSeen = { ...seenStatusesRef.current };
    const newToasts: AdminAlertToast[] = [];
    let changed = false;

    participants.forEach((p) => {
      const prevStatus = nextSeen[p.id];
      const currentStatus = p.status;

      if (prevStatus !== currentStatus) {
        nextSeen[p.id] = currentStatus;
        changed = true;

        // Trigger student login notification when a new student is added to the list
        if (prevStatus === undefined && isLoadedRef.current) {
          const timestampStr = new Date().toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
          });

          const toastId = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          newToasts.push({
            id: toastId,
            participantId: p.id,
            name: p.name,
            status: "Login_Baru",
            examName: p.examName,
            message: `Siswa baru "${p.name}" berhasil login ke portal ujian CBT secara real-time.`,
            timestamp: timestampStr,
            ipAddress: p.ipAddress || `192.168.10.${Math.floor(Math.random() * 89) + 10}`
          });

          // Set auto-dismiss timer for 6 seconds
          setTimeout(() => {
            setToastAlerts((prev) => prev.filter((t) => t.id !== toastId));
          }, 6000);
        }

        // Trigger alarm banner/toast for Mencurigakan or Tidak Aktif status entries
        if (currentStatus === "Mencurigakan" || currentStatus === "Tidak Aktif") {
          const timestampStr = new Date().toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
          });

          const toastId = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          newToasts.push({
            id: toastId,
            participantId: p.id,
            name: p.name,
            status: currentStatus,
            examName: p.examName,
            message: currentStatus === "Mencurigakan"
              ? `Peserta "${p.name}" terdeteksi melakukan pelanggaran tab harian/keluar jendela ujian!`
              : `Status Ujian peserta "${p.name}" dinonaktifkan / ditangguhkan secara paksa!`,
            timestamp: timestampStr
          });

          // Set auto-dismiss timer for 7 seconds
          setTimeout(() => {
            setToastAlerts((prev) => prev.filter((t) => t.id !== toastId));
          }, 7000);
        }
      }
    });

    if (changed) {
      seenStatusesRef.current = nextSeen;
      if (newToasts.length > 0) {
        setToastAlerts((prev) => [...prev, ...newToasts]);
      }
    }
  }, [participants]);

  // Refs and state for real-time WebSocket synchronization
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Ref to always hold the absolute fresh/latest state values, bypassing closures in useEffect
  const latestStateRef = useRef({
    packages,
    questions,
    updates,
    history,
    participants,
    schedules,
    accounts,
    serverTimeConfig
  });

  // Keep latestStateRef updated on every render
  latestStateRef.current = {
    packages,
    questions,
    updates,
    history,
    participants,
    schedules,
    accounts,
    serverTimeConfig
  };
  
  // Guard and prevent infinite synchronizing sync loops
  const ignoreNextWsEmitRef = useRef<Record<string, boolean>>({
    packages: false,
    questions: false,
    updates: false,
    history: false,
    participants: false,
    schedules: false,
    accounts: false,
    serverTimeConfig: false,
  });

  // Setup WebSocket connection to the server
  useEffect(() => {
    let active = true;
    let socket: WebSocket | null = null;
    let reconnectTimeout: any = null;

    // Expose global callback for easy student infraction dispatch
    (window as any).sendCbtInfraction = (pId: string, name: string, message: string, warnings: number) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: "STUDENT_INFRACTION",
          participantId: pId,
          name,
          message,
          warningsCount: warnings
        }));
      }
    };

    function connect() {
      const loc = window.location;
      const protocol = loc.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${loc.host}`;
      console.log("[WS] Menghubungkan ke Real-time CBT Server:", wsUrl);

      socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        if (!active) return;
        setWsConnected(true);
        console.log("[WS] Koneksi tersambung. Mengirim sinkronisasi awal...");

        // Handshake: send current state from ref to avoid stale closure state
        socket?.send(
          JSON.stringify({
            type: "CLIENT_INIT",
            state: latestStateRef.current,
          })
        );
      };

      socket.onmessage = (event) => {
        if (!active) return;
        try {
          const payload = JSON.parse(event.data);
          console.log("[WS] Mengolah event tipe:", payload.type);

          if (payload.type === "SERVER_RECONCILE") {
            const serverState = payload.state;
            if (serverState) {
              if (serverState.packages) {
                ignoreNextWsEmitRef.current.packages = true;
                setPackages(serverState.packages);
              }
              if (serverState.questions) {
                ignoreNextWsEmitRef.current.questions = true;
                setQuestions(serverState.questions);
              }
              if (serverState.updates) {
                ignoreNextWsEmitRef.current.updates = true;
                setUpdates(serverState.updates);
              }
              if (serverState.history) {
                ignoreNextWsEmitRef.current.history = true;
                setHistory(serverState.history);
              }
              if (serverState.participants) {
                ignoreNextWsEmitRef.current.participants = true;
                setParticipants(serverState.participants);
              }
              if (serverState.schedules) {
                ignoreNextWsEmitRef.current.schedules = true;
                setSchedules(serverState.schedules);
              }
              if (serverState.accounts) {
                ignoreNextWsEmitRef.current.accounts = true;
                setAccounts(serverState.accounts);
              }
              if (serverState.serverTimeConfig) {
                ignoreNextWsEmitRef.current.serverTimeConfig = true;
                setServerTimeConfig(serverState.serverTimeConfig);
              }
            }
          } 
          
          else if (payload.type === "STATE_UPDATE") {
            const { key, data } = payload;
            if (key && data) {
              ignoreNextWsEmitRef.current[key] = true;
              if (key === "packages") setPackages(data);
              else if (key === "questions") setQuestions(data);
              else if (key === "updates") setUpdates(data);
              else if (key === "history") setHistory(data);
              else if (key === "participants") setParticipants(data);
              else if (key === "schedules") setSchedules(data);
              else if (key === "accounts") setAccounts(data);
              else if (key === "serverTimeConfig") setServerTimeConfig(data);
            }
          }

          else if (payload.type === "STUDENT_INFRACTION") {
            // Proctor alarm triggered by another browser tab
            const timestampStr = new Date().toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit"
            });
            const toastId = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
            
            setToastAlerts((prev) => [
              {
                id: toastId,
                participantId: payload.participantId,
                name: payload.name,
                status: "Mencurigakan",
                examName: "Sistem Proteksi Menyerah",
                message: `[ALARM LIVE] ${payload.message}`,
                timestamp: timestampStr
              },
              ...prev
            ]);

            setTimeout(() => {
              setToastAlerts((prev) => prev.filter((t) => t.id !== toastId));
            }, 7000);
          }
        } catch (e) {
          console.error("Gagal memproses pesan WebSocket:", e);
        }
      };

      socket.onclose = () => {
        if (!active) return;
        setWsConnected(false);
        console.log("[WS] Koneksi terputus. Menghubungkan kembali dalam 3 detik...");
        reconnectTimeout = setTimeout(connect, 3000);
      };

      socket.onerror = () => {
        socket?.close();
      };
    }

    connect();

    return () => {
      active = false;
      if (socket) socket.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  // Sync state to local storage and broadcast to the Server-side Database
  useEffect(() => {
    localStorage.setItem("cbt_packages", JSON.stringify(packages));
    if (ignoreNextWsEmitRef.current.packages) {
      ignoreNextWsEmitRef.current.packages = false;
    } else if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "STATE_UPDATE", key: "packages", data: packages }));
    }
  }, [packages]);

  useEffect(() => {
    localStorage.setItem("cbt_questions", JSON.stringify(questions));
    if (ignoreNextWsEmitRef.current.questions) {
      ignoreNextWsEmitRef.current.questions = false;
    } else if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "STATE_UPDATE", key: "questions", data: questions }));
    }
  }, [questions]);

  useEffect(() => {
    localStorage.setItem("cbt_updates", JSON.stringify(updates));
    if (ignoreNextWsEmitRef.current.updates) {
      ignoreNextWsEmitRef.current.updates = false;
    } else if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "STATE_UPDATE", key: "updates", data: updates }));
    }
  }, [updates]);

  useEffect(() => {
    localStorage.setItem("cbt_history", JSON.stringify(history));
    if (ignoreNextWsEmitRef.current.history) {
      ignoreNextWsEmitRef.current.history = false;
    } else if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "STATE_UPDATE", key: "history", data: history }));
    }
  }, [history]);

  useEffect(() => {
    localStorage.setItem("cbt_participants", JSON.stringify(participants));
    if (ignoreNextWsEmitRef.current.participants) {
      ignoreNextWsEmitRef.current.participants = false;
    } else if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "STATE_UPDATE", key: "participants", data: participants }));
    }
  }, [participants]);

  useEffect(() => {
    localStorage.setItem("cbt_schedules", JSON.stringify(schedules));
    if (ignoreNextWsEmitRef.current.schedules) {
      ignoreNextWsEmitRef.current.schedules = false;
    } else if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "STATE_UPDATE", key: "schedules", data: schedules }));
    }
  }, [schedules]);

  useEffect(() => {
    localStorage.setItem("cbt_accounts", JSON.stringify(accounts));
    if (ignoreNextWsEmitRef.current.accounts) {
      ignoreNextWsEmitRef.current.accounts = false;
    } else if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "STATE_UPDATE", key: "accounts", data: accounts }));
    }
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem("cbt_server_time_config", JSON.stringify(serverTimeConfig));
    if (ignoreNextWsEmitRef.current.serverTimeConfig) {
      ignoreNextWsEmitRef.current.serverTimeConfig = false;
    } else if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "STATE_UPDATE", key: "serverTimeConfig", data: serverTimeConfig }));
    }
  }, [serverTimeConfig]);

  // Handlers for packages view
  const handleAddPackage = (newPkg: ExamPackage) => {
    setPackages((prev) => [newPkg, ...prev]);
  };
  const handleAddPackageWithQuestions = (newPkg: ExamPackage, newQuestions: any[]) => {
    setPackages((prev) => [newPkg, ...prev]);
    const formattedQuestions: Question[] = newQuestions.map((q, idx) => ({
      id: `q-${newPkg.id}-${Date.now()}-${idx}`,
      packageId: newPkg.id,
      questionText: q.questionText,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation
    }));
    setQuestions((prev) => [...prev, ...formattedQuestions]);
  };
  const handleEditPackage = (editedPkg: ExamPackage) => {
    setPackages((prev) => prev.map((p) => (p.id === editedPkg.id ? editedPkg : p)));
  };
  const handleDeletePackage = (id: string) => {
    setPackages((prev) => prev.filter((p) => p.id !== id));
  };

  // Handlers for updates view
  const handleAddUpdate = (newUpdate: SystemUpdate) => {
    setUpdates((prev) => [newUpdate, ...prev]);
  };
  const handleTogglePinUpdate = (id: string) => {
    setUpdates((prev) => prev.map((u) => (u.id === id ? { ...u, isPinned: !u.isPinned } : u)));
  };
  const handleDeleteUpdate = (id: string) => {
    setUpdates((prev) => prev.filter((u) => u.id !== id));
  };

  // Handlers for schedules view
  const handleToggleLockSchedule = (id: string) => {
    setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, isLocked: !s.isLocked } : s)));
  };
  const handleAddSchedule = (sch: ExamSchedule) => {
    setSchedules((prev) => [sch, ...prev]);
  };
  const handleDeleteSchedule = (id: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  };

  // Handlers for questions view
  const handleAddQuestion = (q: Question) => {
    setQuestions((prev) => [...prev, q]);
  };
  const handleDeleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  // Handlers for accounts view
  const handleToggleAccountStatus = (id: string) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: a.status === "Aktif" ? "Nonaktif" : "Aktif" } : a))
    );
  };
  const handleAddAccount = (acc: UserAccount) => {
    setAccounts((prev) => [acc, ...prev]);
  };
  const handleDeleteAccount = (id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  };
  const handleDeleteHistory = (id: string) => {
    setHistory((prev) => prev.filter((h) => h.id !== id));
  };
  const handleDeleteMultipleHistory = (ids: string[]) => {
    setHistory((prev) => prev.filter((h) => !ids.includes(h.id)));
  };

  const handleResetApp = (options: { resetHistory: boolean; resetSchedules: boolean; resetAccounts: boolean }) => {
    if (options.resetHistory) {
      setHistory([]);
      setParticipants([]);
    }
    if (options.resetSchedules) {
      setSchedules([]);
      setPackages([]);
      setQuestions([]);
    }
    if (options.resetAccounts) {
      const adminAccounts = accounts.filter((acc) => acc.role === "Admin" || acc.email === "admin.sdn14@singkawang.sch.id");
      setAccounts(adminAccounts.length > 0 ? adminAccounts : INITIAL_ACCOUNTS.slice(0, 1));
    }
    alert("Data berhasil dipangkas & dibersihkan! Aplikasi kini berjalan jauh lebih cepat, responsif, dan ringan.");
  };

  // Live Participant Monitoring actions
  const handleForceSubmit = (p: LiveParticipant) => {
    // 1. Remove from active
    setParticipants((prev) => prev.filter((item) => item.id !== p.id));

    // 2. Add to completed history records
    const simulatedScore = Math.floor(Math.random() * 30) + 65; // realistic 65-95 score
    const nextHistoryItem: ExamHistory = {
      id: `hist-${Date.now()}`,
      studentName: p.name,
      studentEmail: p.email,
      examName: p.examName,
      score: simulatedScore,
      maxScore: 100,
      status: simulatedScore >= 70 ? "Lulus" : "Remedial",
      startTime: new Date().toISOString().replace("T", " ").slice(0, 16),
      durationMinutes: Math.floor(Math.random() * 40) + 60
    };
    setHistory((prev) => [nextHistoryItem, ...prev]);
    alert(`Peserta "${p.name}" berhasil dipaksa selesai. Hasil ujian diserahkan ke transkrip.`);
  };

  // Sidebar link details
  const navigationItems = [
    { name: "Dashboard", label: "Dasbor", icon: Home },
    { name: "Packages", label: "Manajemen Paket", icon: Box },
    { name: "Announcements", label: "Pengumuman", icon: Megaphone },
    { category: "Ujian" },
    { name: "History", label: "Riwayat Tes Ujian", icon: Clock },
    { name: "Monitoring", label: "Monitoring Ujian", icon: Radio, isLive: true },
    { name: "StudentPortal", label: "Ujian Siswa (CBT)", icon: BookOpen },
    { category: "Manajemen Ujian" },
    { name: "ExamData", label: "Data Ujian", icon: FileText },
    { name: "Questions", label: "Data Paket Soal", icon: Folder },
    { category: "Manajemen Akun" },
    { name: "Accounts", label: "Data Akun", icon: Users }
  ];

  const renderActiveView = () => {
    switch (activeTab) {
      case "Dashboard":
        return (
          <DashboardView
            participants={participants}
            history={history}
            packages={packages}
            serverTimeConfig={serverTimeConfig}
            onSetServerTimeConfig={setServerTimeConfig}
          />
        );
      case "Packages":
        return (
          <PackagesView
            packages={packages}
            onAddPackage={handleAddPackage}
            onEditPackage={handleEditPackage}
            onDeletePackage={handleDeletePackage}
            onAddPackageWithQuestions={handleAddPackageWithQuestions}
          />
        );
      case "Announcements":
        return (
          <AnnouncementsView
            updates={updates}
            onAddUpdate={handleAddUpdate}
            onTogglePinUpdate={handleTogglePinUpdate}
            onDeleteUpdate={handleDeleteUpdate}
          />
        );
      case "History":
        return (
          <HistoryView
            history={history}
            onDeleteHistory={handleDeleteHistory}
            onDeleteMultipleHistory={handleDeleteMultipleHistory}
          />
        );
      case "Monitoring":
        return (
          <MonitorView
            participants={participants}
            onSetParticipants={setParticipants}
            onForceSubmit={handleForceSubmit}
          />
        );
      case "StudentPortal":
        return (
          <StudentPortalView
            schedules={schedules}
            packages={packages}
            questions={questions}
            participants={participants}
            onSetParticipants={setParticipants}
            history={history}
            onAddHistory={(newRecord) => {
              setHistory((prev) => [newRecord, ...prev]);
            }}
            serverTimeConfig={serverTimeConfig}
          />
        );
      case "ExamData":
        return (
          <SchedulesView
            schedules={schedules}
            onToggleLock={handleToggleLockSchedule}
            onAddSchedule={handleAddSchedule}
            onDeleteSchedule={handleDeleteSchedule}
            serverTimeConfig={serverTimeConfig}
          />
        );
      case "Questions":
        return (
          <QuestionsView
            questions={questions}
            packages={packages}
            onAddQuestion={handleAddQuestion}
            onDeleteQuestion={handleDeleteQuestion}
          />
        );
      case "Accounts":
        return (
          <AccountsView
            accounts={accounts}
            onToggleStatus={handleToggleAccountStatus}
            onAddAccount={handleAddAccount}
            onDeleteAccount={handleDeleteAccount}
            onResetApp={handleResetApp}
          />
        );
      default:
        return (
          <div className="p-8 text-center text-slate-400">
            Halaman ini sedang dalam pengembangan.
          </div>
        );
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminUsername === "admin" && adminPassword === "user123") {
      setUserRole("admin");
      localStorage.setItem("cbt_user_role", "admin");
      setLoginError("");
    } else {
      setLoginError("Username atau Password Admin salah!");
    }
  };

  if (userRole === null) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-cyan-400 via-pink-500 via-purple-600 to-amber-400 text-slate-100 flex flex-col justify-between font-sans select-none overflow-x-hidden p-6 md:p-12 relative">
        <div className="absolute inset-0 bg-transparent opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none"></div>
        
        {/* Upper Brand Info */}
        <header className="max-w-6xl mx-auto w-full flex flex-col sm:flex-row justify-between items-center relative z-10 pb-6 border-b border-white/20 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-yellow-300 via-pink-500 to-cyan-400 text-slate-950 rounded-2xl shadow-xl flex items-center justify-center font-bold">
              <Laptop size={22} className="animate-pulse" />
            </div>
            <div>
              <h2 className="font-black text-white text-sm md:text-base tracking-tight font-heading uppercase leading-none drop-shadow-md">
                CBT UJIAN ONLINE SDN 14 SINGKAWANG
              </h2>
              <span className="text-[10px] text-yellow-250 text-yellow-300 font-mono tracking-widest uppercase block font-black mt-1.5 drop-shadow-xs">STUDIODHS • PORTAL MANDIRI</span>
            </div>
          </div>
          <span className={`text-[10px] font-mono font-bold px-4 py-1.5 rounded-full border tracking-wider transition-all duration-300 ${
            wsConnected 
              ? "text-emerald-300 bg-emerald-500/20 border-emerald-400/40" 
              : "text-amber-300 bg-amber-500/10 border-amber-400/30 animate-pulse"
          }`}>
            {wsConnected ? "🟢 REALTIME SYNC: AKTIF" : "🛰️ REALTIME: MENGHUBUNGKAN..."}
          </span>
        </header>

        {/* Main Grid Selector Section */}
        <main className="max-w-5xl mx-auto w-full my-auto py-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch relative z-10">
          
          {/* LEFT COLUMN: CANDIDATE PORTAL (DIRECT ACCESS) */}
          <div className="bg-slate-950/85 backdrop-blur-xl border-2 border-white/10 rounded-3xl p-8 flex flex-col justify-between space-y-8 hover:shadow-3xl hover:border-cyan-400/50 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -right-12 -top-12 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl group-hover:bg-cyan-500/30 transition-all duration-300"></div>
            
            <div className="space-y-5 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-400 to-indigo-500 text-white flex items-center justify-center shadow-lg" style={{ boxShadow: "0 8px 24px -4px rgba(34, 211, 238, 0.4)" }}>
                <BookOpen size={26} />
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] text-cyan-400 font-black font-mono tracking-widest uppercase">PESERTA DIDIK</span>
                <h3 className="text-2xl font-black text-white font-heading">PORTAL LEMBAR SISWA</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-sans font-medium">
                  Masuki halaman lembar pengerjaan tes dengan mengonfirmasi jadwal ujian aktif yang dikeluarkan oleh Guru kelas Anda. Jawab butir soal dengan tertib, aman, dan dapatkan analisis ulasan nilai instan begitu Anda selesai!
                </p>
              </div>

              <div className="p-4 bg-slate-900/60 border border-white/5 rounded-2xl space-y-2 text-[11.5px] text-slate-200">
                <div className="flex items-center gap-1.5 font-black text-cyan-300">
                  <Sparkles size={14} className="animate-spin text-cyan-400" style={{ animationDuration: "8s" }} /> FITUR PROTEKSI AKTIF:
                </div>
                <ul className="list-disc pl-4 space-y-1.5 font-sans text-slate-400 text-[11px] leading-relaxed">
                  <li>Integritas <strong className="text-cyan-300">Lockdown Browser</strong> (Toleransi Tab-loss 3 kali).</li>
                  <li>Real-time synchronization dengan server Proctor Pengawas.</li>
                  <li>Transkrip koreksi instan langsung berserta rekap lembar jawaban.</li>
                </ul>
              </div>
            </div>

            <div className="relative z-10 pt-2">
              <button
                onClick={() => {
                  setUserRole("student");
                  localStorage.setItem("cbt_user_role", "student");
                }}
                className="w-full py-3.5 bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-600 hover:from-cyan-500 hover:to-purple-700 hover:shadow-2xl hover:shadow-indigo-500/30 text-white font-extrabold text-xs rounded-2xl transition duration-300 cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
              >
                Mulai Ujian Siswa (CBT) 🚀
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: ADMINISTRATOR PROCTOR (CREDENTIAL SCREEN) */}
          <div className="bg-slate-950/85 backdrop-blur-xl border-2 border-white/10 rounded-3xl p-8 flex flex-col justify-between space-y-8 hover:shadow-3xl hover:border-pink-500/50 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -right-12 -top-12 w-32 h-32 bg-pink-500/20 rounded-full blur-2xl group-hover:bg-pink-500/30 transition-all duration-300"></div>
            
            <div className="space-y-4 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-600 text-white flex items-center justify-center shadow-lg" style={{ boxShadow: "0 8px 24px -4px rgba(244, 63, 94, 0.4)" }}>
                <Laptop size={26} />
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] text-pink-400 font-black font-mono tracking-widest uppercase">GURU / PENGAWAS</span>
                <h3 className="text-2xl font-black text-white font-heading">PORTAL PANEL ADMIN</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-sans font-medium">
                  Hak pengerjaan konfigurasi bank paket soal, penjadwalan ulangan kelas, rilis token keamanan baru, tracking integritas murid, and unduh berkas laporan analitis siswa.
                </p>
              </div>

              {loginError && (
                <div className="p-3 bg-rose-950/80 text-rose-300 border border-rose-900 rounded-xl text-xs font-bold leading-relaxed">
                  ⚠️ {loginError}
                </div>
              )}

              {/* Login Credentials Box */}
              <form onSubmit={handleAdminLogin} className="space-y-3.5 pt-1">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-extrabold text-pink-400 uppercase tracking-widest block">NAMA PENGGUNA *</label>
                  <input
                    type="text"
                    required
                    placeholder=""
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    className="w-full text-xs bg-slate-900/90 border border-white/10 focus:border-pink-400 focus:ring-1 focus:ring-pink-400 outline-none text-white font-bold p-3 rounded-xl placeholder:text-slate-650 transition duration-150"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-extrabold text-pink-400 uppercase tracking-widest block">KATA SANDI ADMIN *</label>
                  <input
                    type="password"
                    required
                    placeholder=""
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full text-xs bg-slate-900/90 border border-white/10 focus:border-pink-400 focus:ring-1 focus:ring-pink-400 outline-none text-white font-bold p-3 rounded-xl placeholder:text-slate-650 font-mono transition duration-150"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-extrabold text-xs rounded-2xl transition duration-300 cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wider"
                >
                  Masuk Dashboard Guru 💻
                </button>
              </form>
            </div>
          </div>

        </main>

        {/* Global Footer Details */}
        <footer className="max-w-6xl mx-auto w-full relative z-10 pt-4 border-t border-white/20 text-center flex flex-col sm:flex-row justify-between items-center text-[10px] text-white/70 font-semibold gap-2 drop-shadow-sm">
          <span>&copy; {new Date().getFullYear()} SDN 14 SINGKAWANG — ASSESSMENT CENTER. ALL RIGHTS RESERVED.</span>
          <span>SISTEM CBT VERSI UNGGULAN 2.50 (VIBRANT THEME)</span>
        </footer>

      </div>
    );
  }

  if (userRole === "student") {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-teal-300 via-sky-400 to-indigo-500 p-4 md:p-8 font-sans select-none overflow-x-hidden flex flex-col justify-center relative">
        <div className="absolute inset-0 bg-transparent opacity-10 bg-[radial-gradient(#ffffff_1.5px,transparent_1.5px)] [background-size:24px_24px] pointer-events-none"></div>
        <div className="max-w-5xl mx-auto w-full relative z-10">
          <StudentPortalView
            schedules={schedules}
            packages={packages}
            questions={questions}
            participants={participants}
            onSetParticipants={setParticipants}
            history={history}
            onAddHistory={(newRecord) => {
              setHistory((prev) => [newRecord, ...prev]);
            }}
            onGoBack={() => {
              setUserRole(null);
              localStorage.removeItem("cbt_user_role");
            }}
            serverTimeConfig={serverTimeConfig}
          />
        </div>
      </div>
    );
  }

  // default to admin layout:
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none overflow-x-hidden">
      
      {/* Upper header section for Mobile and Tablet layout */}
      <header className="lg:hidden bg-white border-b border-slate-200 px-5 py-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-red-50 text-red-600 rounded">
            <Laptop size={18} />
          </div>
          <span className="font-extrabold text-sm tracking-tight text-slate-800 font-heading select-none">CBT Admin</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Notification icon */}
          <button
            onClick={() => setShowNotificationPopup(!showNotificationPopup)}
            className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 rounded-lg shrink-0 relative"
          >
            <Bell size={16} />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-600 rounded-full"></span>
          </button>
          
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
          >
            {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Main core Flex column container */}
      <div className="flex flex-1 relative">
        
        {/* SIDEBAR NAVIGATION - DESKTOP SIDE BAR */}
        <aside
          className={`shrink-0 w-[260px] bg-white border-r border-slate-200 h-screen fixed top-0 left-0 overflow-y-auto flex flex-col justify-between p-5 z-40 transition-all duration-300 lg:translate-x-0 ${
            isMobileOpen ? "translate-x-0" : "-translate-x-full lg:block"
          }`}
        >
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-red-50 text-red-600 rounded-xl shadow-2xs">
                  <Laptop size={20} />
                </div>
                <div className="leading-tight">
                  <h4 className="font-black text-slate-800 text-sm tracking-tight font-heading">CBT Admin</h4>
                  <span className="text-[10px] text-slate-400 font-mono tracking-widest block font-bold uppercase">Dashboard Panel</span>
                </div>
              </div>

              {/* Mobile Close Button */}
              <button
                onClick={() => setIsMobileOpen(false)}
                className="lg:hidden p-1 text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Nav list of items */}
            <nav className="space-y-1 text-xs">
              {navigationItems.map((item, index) => {
                if ("category" in item) {
                  return (
                    <div
                      key={`cat-${index}`}
                      className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-3 pt-4 pb-2 select-none"
                    >
                      {item.category}
                    </div>
                  );
                }

                const IconComponent = item.icon;
                const isActive = activeTab === item.name;

                return (
                  <button
                    key={`nav-${index}`}
                    onClick={() => {
                      setActiveTab(item.name || "Dashboard");
                      setIsMobileOpen(false);
                    }}
                    className={`w-full flex items-center justify-between pl-3 pr-4 py-2.5 rounded-xl font-semibold tracking-wide transition uppercase text-[11px] cursor-pointer ${
                      isActive
                        ? "bg-red-50 text-red-600 font-extrabold border-r-3 border-red-600"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <IconComponent size={15} className={`shrink-0 ${isActive ? "text-red-600" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.isLive && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-red-100 text-red-700 font-bold text-[9px] rounded-full animate-pulse uppercase">
                        ● LIVE
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar bottom footer profile node */}
          <div className="pt-4 border-t border-slate-100 mt-6 space-y-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center border border-red-200 shadow-2xs shrink-0 select-none">
                D
              </div>
              <div className="min-w-0 leading-tight">
                <h5 className="font-bold text-slate-800 text-xs truncate font-heading">Dedy Hendriawan</h5>
                <span className="text-[10px] text-slate-400 font-mono truncate block">dedyhendriawansusanto@gmail.com</span>
              </div>
            </div>
            
            <button
              onClick={() => {
                setUserRole(null);
                localStorage.removeItem("cbt_user_role");
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-slate-200 hover:border-red-200 hover:bg-red-50 hover:text-red-700 text-slate-500 font-semibold text-xs rounded-lg transition cursor-pointer"
            >
              <Power size={13} />
              <span>Keluar dari Admin</span>
            </button>
          </div>
        </aside>

        {/* CORE MAIN SCRIPTS COVER CONTAINER */}
        <main className="flex-1 min-w-0 p-5 sm:p-8 lg:ml-[260px] pb-16 space-y-6">
          {/* Top header navigation breadcrumb strip bar */}
          <div className="hidden lg:flex justify-between items-center pb-4 border-b border-slate-100">
            <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <span>ADMINISTRATOR PANEL</span>
              <span>/</span>
              <span className="text-red-600 font-bold tracking-wider uppercase font-mono">
                {activeTab} VIEW
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* Notification icon */}
              <div className="relative">
                <button
                  onClick={() => setShowNotificationPopup(!showNotificationPopup)}
                  className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shrink-0 cursor-pointer shadow-2xs"
                >
                  <Bell size={16} />
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-600 rounded-full border border-white"></span>
                </button>

                {showNotificationPopup && (
                  <div className="absolute right-0 top-11 bg-white border border-slate-200 rounded-xl shadow-lg w-72 text-xs p-4 space-y-3 z-50 animate-fadeIn">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                      <span>Notifikasi Sistem</span>
                      <button onClick={() => setShowNotificationPopup(false)} className="text-slate-400 hover:text-slate-600">
                        <X size={13} />
                      </button>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      <div className="p-2 bg-red-50 text-red-950 rounded border border-red-100">
                        <span className="font-bold block text-[10px]">CBT LOCKDOWN ALARM</span>
                        Amanda Syahputri keluar dari halaman ujian 3 kali!
                      </div>
                      <div className="p-2 bg-slate-50 text-slate-700 rounded border border-slate-100">
                        <span className="font-bold block text-[10px]">PENJADWALAN UPDATE</span>
                        Server CBT region Jakarta selesai ditingkatkan.
                      </div>
                    </div>
                  </div>
                )}
              </div>

               {/* Standard session control info */}
              <div className={`px-3.5 py-1.5 border rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-2 transition-all duration-300 ${
                wsConnected 
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700 font-bold" 
                  : "bg-rose-50 border-rose-200 text-rose-700 animate-pulse font-semibold"
              }`}>
                <span className={`h-2 w-2 rounded-full ${wsConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500 animate-ping"}`}></span>
                <span>{wsConnected ? "Real-Time Sync Terhubung" : "Real-Time Terputus"}</span>
              </div>
            </div>
          </div>

          {/* Render target active view dynamic selection */}
          <div className="animate-fadeIn">{renderActiveView()}</div>
        </main>
      </div>

      {/* Live Student Login Toast Notification System (Pojok Kanan Atas) */}
      <div className="fixed top-6 right-6 z-50 space-y-3 max-w-sm w-full pointer-events-none">
        {toastAlerts.filter((t) => t.status === "Login_Baru").map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto p-4 rounded-2xl shadow-2xl border border-emerald-500/30 bg-slate-900/95 text-white animate-slideIn flex gap-3.5 items-start backdrop-blur-md"
          >
            <div className="p-2.5 rounded-xl shrink-0 bg-emerald-500/20 text-emerald-400">
              <UserCheck size={18} className="animate-pulse" />
            </div>

            <div className="flex-1 space-y-1.5 text-xs">
              <div className="flex justify-between items-center gap-2">
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full font-mono bg-emerald-500/35 text-emerald-200">
                  Siswa Login Baru ⚡
                </span>
                <span className="text-[10px] text-slate-400 font-mono font-bold">
                  {toast.timestamp}
                </span>
              </div>

              <p className="font-bold leading-normal text-slate-100 font-sans">
                {toast.message}
              </p>

              <div className="text-[10.5px] text-slate-300 font-sans leading-tight bg-white/5 p-2 rounded-lg border border-white/5 space-y-0.5">
                <div><span className="text-slate-400 font-bold">Mata Ujian:</span> {toast.examName}</div>
                {toast.ipAddress && (
                  <div><span className="text-slate-400 font-bold">IP Address:</span> {toast.ipAddress}</div>
                )}
              </div>

              <div className="flex gap-2 pt-1 font-sans justify-end">
                <button
                  type="button"
                  onClick={() => setToastAlerts((prev) => prev.filter((t) => t.id !== toast.id))}
                  className="px-2.5 py-1 text-slate-400 hover:text-white font-bold text-[10px] uppercase cursor-pointer transition"
                >
                  Tutup
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setToastAlerts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-slate-400 hover:text-white transition cursor-pointer shrink-0 p-1"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Live Proctored Toast Alerts System */}
      <div className="fixed bottom-6 right-6 z-50 space-y-3 max-w-sm w-full pointer-events-none">
        {toastAlerts.filter((t) => t.status !== "Login_Baru").map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 flex gap-3.5 items-start ${
              toast.status === "Tidak Aktif"
                ? "bg-slate-900/95 border-red-500/30 text-white animate-slideIn"
                : "bg-amber-950/95 border-amber-500/30 text-white animate-slideIn"
            }`}
          >
            <div className={`p-2 rounded-xl shrink-0 ${
              toast.status === "Tidak Aktif" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
            }`}>
              {toast.status === "Tidak Aktif" ? (
                <ShieldAlert size={18} className="animate-pulse text-red-400" />
              ) : (
                <AlertTriangle size={18} className="animate-bounce text-amber-400" />
              )}
            </div>

            <div className="flex-1 space-y-1.5 text-xs">
              <div className="flex justify-between items-center gap-2">
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full font-mono ${
                  toast.status === "Tidak Aktif"
                    ? "bg-red-500/35 text-red-200 animate-pulse"
                    : "bg-amber-500/35 text-amber-200"
                }`}>
                  ALARM: {toast.status === "Tidak Aktif" ? "TIDAK AKTIF" : "MENCURIGAKAN"}
                </span>
                <span className="text-[10px] text-slate-400 font-mono font-bold">
                  {toast.timestamp}
                </span>
              </div>

              <p className="font-bold leading-normal text-slate-100">
                {toast.message}
              </p>

              <div className="text-[10.5px] text-slate-300 font-sans leading-tight bg-white/5 p-2 rounded-lg border border-white/5 space-y-0.5">
                <div><span className="text-slate-400 font-bold">Siswa:</span> {toast.name}</div>
                <div><span className="text-slate-450 font-bold">Mata Pelajaran:</span> {toast.examName}</div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("Monitoring");
                    setToastAlerts((prev) => prev.filter((t) => t.id !== toast.id));
                  }}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white font-extrabold text-[10px] rounded-lg transition uppercase tracking-wide cursor-pointer flex items-center gap-1 border border-white/10"
                >
                  Buka Monitor Ujian ⚡
                </button>
                <button
                  type="button"
                  onClick={() => setToastAlerts((prev) => prev.filter((t) => t.id !== toast.id))}
                  className="px-2.5 py-1 text-slate-400 hover:text-white font-bold text-[10px] uppercase cursor-pointer"
                >
                  Abaikan
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setToastAlerts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-slate-400 hover:text-white transition cursor-pointer shrink-0 p-1"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
