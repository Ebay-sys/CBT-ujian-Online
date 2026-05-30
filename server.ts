import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import fs from "fs";
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  setDoc, 
  getDoc,
  doc, 
  deleteDoc 
} from "firebase/firestore";
import { 
  INITIAL_PACKAGES, 
  INITIAL_QUESTIONS, 
  INITIAL_UPDATES, 
  INITIAL_HISTORY, 
  INITIAL_PARTICIPANTS, 
  INITIAL_SCHEDULES, 
  INITIAL_ACCOUNTS 
} from "./src/data";

dotenv.config();

const app = express();
const PORT = 3000;

// Load Firebase Config
const firebaseConfig = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf8")
);
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: "SERVER",
      email: "server@cbt.internal",
      emailVerified: true,
      isAnonymous: false,
    },
    operationType,
    path
  };
  console.error('[Firestore Error]: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Create HTTP server wrapping the Express app to support dual HTTP + WebSockets on port 3000
const httpServer = new HttpServer(app);

// Server-side in-memory real-time state database
const serverDbState: {
  packages: any[] | null;
  questions: any[] | null;
  updates: any[] | null;
  history: any[] | null;
  participants: any[] | null;
  schedules: any[] | null;
  accounts: any[] | null;
  activityLogs: any[] | null;
  serverTimeConfig: { useManualTime: boolean; offsetMs: number } | null;
} = {
  packages: null,
  questions: null,
  updates: null,
  history: null,
  participants: null,
  schedules: null,
  accounts: null,
  activityLogs: null,
  serverTimeConfig: null,
};

// Initialize WebSocket server directly on the HTTP server
const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", (ws) => {
  console.log("Client connected to CBT Real-Time WebSocket Server");

  // Send a greeting to verify connection is active
  ws.send(JSON.stringify({ 
    type: "SYSTEM_HELLO", 
    message: "Terhubung ke Server Real-time CBT SDN 14",
    serverHasState: !!serverDbState.participants
  }));

  ws.on("message", (rawMsg) => {
    try {
      const payload = JSON.parse(rawMsg.toString());
      
      if (payload.type === "CLIENT_INIT") {
        const { state } = payload;
        let initialized = false;
        
        // If server state is empty, pre-populate state from the first client (e.g. its localStorage)
        if (!serverDbState.participants && state) {
          if (state.packages) serverDbState.packages = state.packages;
          if (state.questions) serverDbState.questions = state.questions;
          if (state.updates) serverDbState.updates = state.updates;
          if (state.history) serverDbState.history = state.history;
          if (state.participants) serverDbState.participants = state.participants;
          if (state.schedules) serverDbState.schedules = state.schedules;
          if (state.accounts) serverDbState.accounts = state.accounts;
          if (state.activityLogs) serverDbState.activityLogs = state.activityLogs;
          if (state.serverTimeConfig) serverDbState.serverTimeConfig = state.serverTimeConfig;
          initialized = true;
          console.log("Server real-time state initialized from connected client data model.");
        }

        // Return current server state for alignment
        ws.send(JSON.stringify({
          type: "SERVER_RECONCILE",
          state: {
            packages: serverDbState.packages,
            questions: serverDbState.questions,
            updates: serverDbState.updates,
            history: serverDbState.history,
            participants: serverDbState.participants,
            schedules: serverDbState.schedules,
            accounts: serverDbState.accounts,
            activityLogs: serverDbState.activityLogs,
            serverTimeConfig: serverDbState.serverTimeConfig,
          }
        }));

        // Broadcast the resolved state to other clients if this is the initial boot
        if (initialized) {
          broadcastToOthers(ws, {
            type: "SERVER_RECONCILE",
            state: serverDbState
          });
        }
      } 
      
      else if (payload.type === "STATE_UPDATE") {
        const { key, data } = payload;
        if (key in serverDbState) {
          (serverDbState as any)[key] = data;
          console.log(`Real-time state updated on server key [${key}] with ${Array.isArray(data) ? data.length : "obj"} items`);
          
          // Background sync to Firestore for cloud persistence
          if (key === "serverTimeConfig") {
            syncServerTimeConfigToFirestore(data);
          } else {
            syncCollectionToFirestore(key, data);
          }

          // Broadcast to all other connections
          broadcastToOthers(ws, {
            type: "STATE_UPDATE",
            key,
            data
          });
        }
      }
      
      else if (payload.type === "STUDENT_INFRACTION") {
        console.log(`Infraction warning for student [${payload.name}]: ${payload.message}`);
        // Broadcast infraction to active monitors
        broadcastToOthers(ws, {
          type: "STUDENT_INFRACTION",
          participantId: payload.participantId,
          name: payload.name,
          message: payload.message,
          warningsCount: payload.warningsCount
        });
      }
    } catch (err) {
      console.error("Error processing WebSocket message:", err);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected from CBT Real-Time WebSocket Server");
  });
});

function broadcastToOthers(sender: WebSocket, payload: any) {
  const msgStr = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(msgStr);
    }
  });
}

app.use(express.json());

// Lazy-initialize Gemini client to prevent crash at startup if key is missing
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY belum terkonfigurasi di Google AI Studio Settings.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Fallback questions generator helper to ensure a responsive demo even if the key is missing or invalid
function generateFallbackQuestions(jenjang: string, kelas: string, subject: string, topic: string) {
  const cleanSubject = subject.trim() || "Mata Pelajaran";
  const cleanTopic = topic.trim() || "Materi Umum";
  return [
    {
      questionText: `STIMULUS:
Pembelajaran materi ${cleanTopic} di tingkat ${kelas} dirancang untuk mendorong pemahaman mendalam tentang prinsip-prinsip dasarnya. Dalam kehidupan sehari-hari, penguasaan materi ini sangat berguna sebagai fondasi utama di jenjang ${jenjang} dalam menyusun dan merancang solusi analitis secara mandiri.

PERTANYAAN:
Berdasarkan stimulus di atas, manakah pernyataan berikut yang paling tepat mendefinisikan esensi dari pokok bahasan tersebut?`,
      options: [
        { key: "A", text: "Merupakan fondasi utama dalam memahami analisis tingkat lanjut secara konseptual." },
        { key: "B", text: "Hanya berlaku untuk pembelajaran teori tanpa adanya aplikasi praktis di lapangan." },
        { key: "C", text: "Merupakan materi pelengkap yang tidak wajib diujikan dalam kurikulum nasional." },
        { key: "D", text: "Hanya dipelajari pada semester akhir tanpa relevansi dengan mata pelajaran terkait." },
        { key: "E", text: "Seluruh jawaban A, B, C, dan D benar menurut standar kurikulum." }
      ],
      correctAnswer: "A",
      explanation: `Pembahasan: Konsep dasar ${cleanTopic} pada tingkat ${kelas} dirancang khusus untuk membangun fondasi pemahaman intelektual yang kokoh.`
    },
    {
      questionText: `STIMULUS:
Di era modern, pemahaman yang kuat terhadap kompetensi ${cleanSubject} sangat berguna bagi keberhasilan akademis maupun profesional siswa. Menguasai topik "${cleanTopic}" memampukan siswa untuk berpikir kritis, menyusun solusi logis atas masalah, dan meningkatkan penalaran analitis adaptif.

PERTANYAAN:
Dalam konteks pembelajaran abad 21 sesuai stimulus di atas, apa dampak utama yang diperoleh peserta didik dengan menguasai topik "${cleanTopic}"?`,
      options: [
        { key: "A", text: "Meningkatkan kemampuan problem-solving dan penalaran analitis adaptif." },
        { key: "B", text: "Mengabaikan nilai-nilai kolaboratif dalam pengerjaan tugas mandiri." },
        { key: "C", text: "Membatasi daya kritis anak dalam mengeksplorasi literatur sains eksternal." },
        { key: "D", text: "Mengurangi beban belajar harian secara drastis." },
        { key: "E", text: "Mempercepat masa studi tanpa penilaian objektif pencapaian kompetensi." }
      ],
      correctAnswer: "A",
      explanation: `Pembahasan: Penguasaan kompetensi "${cleanTopic}" mendorong peningkatan daya pikir kritis (Higher Order Thinking Skills - HOTS) dan pemecahan masalah secara terstruktur.`
    },
    {
      questionText: `STIMULUS:
Terdapat berbagai pendekatan pengajaran yang dapat diterapkan pada materi ${cleanTopic} di jenjang ${jenjang}. Di antaranya, pendekatan eksploratif berbasis inkuiri dan analisis studi kasus kontekstual terbukti memberikan sisa pemahaman yang mendalam dibandingkan metode konvensional biasa.

PERTANYAAN:
Manakah dari metode berikut yang paling efektif untuk memecahkan persoalan nyata pada tema "${cleanTopic}" secara kontekstual?`,
      options: [
        { key: "A", text: "Metode hafalan rumus instan tanpa memahami latar belakang teori." },
        { key: "B", text: "Pendekatan eksploratif berbasis inkuiri dan studi kasus kontekstual." },
        { key: "C", text: "Mengabaikan latihan soal dan memfokuskan pengerjaan secara acak." },
        { key: "D", text: "Meniru seluruh modul cetak tanpa melakukan penyesuaian kelas." },
        { key: "E", text: "Menunda waktu belajar hingga menjelang pelaksanaan ujian CBT." }
      ],
      correctAnswer: "B",
      explanation: `Pembahasan: Pembelajaran bermakna dengan metode kontekstual dan berbasis aktivitas inkuiri terbukti paling efektif untuk memahami materi ini.`
    }
  ];
}

// Helper to generate fallback package info & questions
function generateFallbackPackage(jenjang: string, kelas: string, subject: string, topic: string, totalQuestions: number, duration: number, difficulty: "Mudah" | "Sedang" | "Sulit", jumlahOpsi: string = "ABCD") {
  const cleanSubject = subject.trim() || "Mata Pelajaran";
  const cleanTopic = topic.trim() || "Materi Umum";
  const name = `Paket AI: ${cleanSubject} - ${cleanTopic} (${kelas})`;
  const category = cleanSubject;
  const description = `Paket ujian mandiri berbasis komputer (CBT) untuk menguji penguasaan materi ${cleanTopic} pada tingkat ${kelas} dengan tingkat kesulitan ${difficulty}.`;
  
  const fallbackQuestions = generateFallbackQuestions(jenjang, kelas, subject, topic);
  const questionsList = [];
  for (let i = 0; i < totalQuestions; i++) {
    const q = fallbackQuestions[i % fallbackQuestions.length];
    
    // Slice / Adjust options based on jumlahOpsi
    let cleanOptions = [...q.options];
    if (jumlahOpsi === "ABC") {
      cleanOptions = cleanOptions.slice(0, 3);
    } else if (jumlahOpsi === "ABCD") {
      cleanOptions = cleanOptions.slice(0, 4);
    }
    
    // Adjust correctAnswer if it's sliced out
    let cleanAnswer = q.correctAnswer;
    const availableKeys = cleanOptions.map(o => o.key);
    if (!availableKeys.includes(cleanAnswer)) {
      cleanAnswer = "A";
    }

    questionsList.push({
      questionText: `[AI Solusi ${i + 1}] ` + q.questionText,
      options: cleanOptions,
      correctAnswer: cleanAnswer,
      explanation: q.explanation
    });
  }

  return {
    packageInfo: {
      name,
      category,
      description,
      duration: duration || 60,
      totalQuestions: totalQuestions || 5,
      difficulty: difficulty || "Sedang"
    },
    questions: questionsList
  };
}

// API to generate a complete exam package + questions with Gemini
app.post("/api/gemini/generate-full-package", async (req, res) => {
  const {
    jenjang = "SD",
    kelas = "Kelas 4",
    fase = "Fase B",
    subject,
    topic,
    totalQuestions = 5,
    duration = 60,
    difficulty = "Sedang",
    jumlahOpsi = "ABCD"
  } = req.body;

  if (!subject || !topic) {
    return res.status(400).json({
      error: "Mata Pelajaran dan Topik/Materi wajib diisi untuk melakukan generate paket!"
    });
  }

  try {
    const ai = getGeminiClient();
    
    let optionsText = 'tepat 5 buah objek opsi dengan key "A", "B", "C", "D", "E"';
    let keysText = '"A", "B", "C", "D", "E"';
    if (jumlahOpsi === "ABC") {
      optionsText = 'tepat 3 buah objek opsi dengan key "A", "B", "C"';
      keysText = '"A", "B", "C"';
    } else if (jumlahOpsi === "ABCD") {
      optionsText = 'tepat 4 buah objek opsi dengan key "A", "B", "C", "D"';
      keysText = '"A", "B", "C", "D"';
    }

    const prompt = `Buatlah draf satu paket soal materi lengkap terstruktur dalam Bahasa Indonesia sesuai parameter berikut:
- Sekolah / Jenjang: ${jenjang}
- Kelas: ${kelas}
- Fase: ${fase}
- Mata Pelajaran: ${subject}
- Topik / Materi Bahasan: ${topic}
- Jumlah Soal: ${totalQuestions} butir soal
- Durasi Ujian: ${duration} menit
- Tingkat Kesulitan Paket secara umum: ${difficulty}

Objek JSON yang dihasilkan harus memiliki properti utama sebagai berikut:
1. "packageInfo": Objek berisi:
   - "name": Nama paket soal kreatif, formal, dan relevan (maks 50 karakter). Contoh: "Try Out ${subject}: ${topic} ${kelas}"
   - "category": Nama mata pelajaran (${subject}) atau kategori yang sesuai.
   - "description": Penjelasan ringkas berkualitas akademis membujuk siswa berlatih (maks 150 karakter).
   - "duration": durasi ujian (${duration}) sebagai angka.
   - "totalQuestions": jumlah soal (${totalQuestions}) sebagai angka.
   - "difficulty": Tingkat kesulitan ("${difficulty}").
2. "questions": Array berisi tepat ${totalQuestions} buah objek soal. Setiap objek soal wajib berisi:
   - "questionText": Susun teks pertanyaan dalam format stimulus ujian standar AKM / Kurikulum Merdeka yang sangat rapi. Struktur teks wajib menggunakan format teks persis seperti di bawah ini, dipisahkan baris kosong:
     
     STIMULUS:
     [Tulis paragraf stimulus kontekstual berupa cerita kasus nyata, wacana informatif, cuplikan data, skenario simulasi, atau teori yang menarik]
     
     PERTANYAAN:
     [Tulis kalimat pertanyaan yang sangat tepat, tajam, terarah, dan langsung menanyakan esensi materi berdasarkan stimulus di atas]
     
   - "options": Array berisi ${optionsText} dan text isi jawaban yang bersaing.
   - "correctAnswer": Satu kunci dari [${keysText}].
   - "explanation": Penjelasan akademis diawali "Pembahasan: " yang terperinci.

Pastikan respons Anda adalah pasangan murni terformat valid JSON sesuai deskripsi schema tersebut.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            packageInfo: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                category: { type: Type.STRING },
                description: { type: Type.STRING },
                duration: { type: Type.INTEGER },
                totalQuestions: { type: Type.INTEGER },
                difficulty: { type: Type.STRING }
              },
              required: ["name", "category", "description", "duration", "totalQuestions", "difficulty"]
            },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  questionText: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        key: { type: Type.STRING },
                        text: { type: Type.STRING }
                      },
                      required: ["key", "text"]
                    }
                  },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ["questionText", "options", "correctAnswer", "explanation"]
              }
            }
          },
          required: ["packageInfo", "questions"]
        }
      }
    });

    const text = response.text || "";
    const parsedData = JSON.parse(text);
    return res.json({
      success: true,
      package: parsedData.packageInfo,
      questions: parsedData.questions,
      source: "gemini-ai"
    });

  } catch (error: any) {
    console.log("Gemini Full Package Generation: Menggunakan Fallback Engine karena:", error.message || error);
    const fallbackData = generateFallbackPackage(jenjang, kelas, subject, topic, totalQuestions, duration, difficulty, jumlahOpsi);
    return res.json({
      success: true,
      message: "GEMINI_API_KEY belum terkonfigurasi di Google AI Studio Settings. Menggunakan fallback template otomatis.",
      package: fallbackData.packageInfo,
      questions: fallbackData.questions,
      source: "fallback-engine"
    });
  }
});

// API to generate questions with Gemini
app.post("/api/gemini/generate-questions", async (req, res) => {
  const {
    jenjang,
    fase,
    kelas,
    subject,
    topic,
    bentukSoal = "Pilihan Ganda",
    tambahGambar = false,
    activeDifficulties = ["Sedang"],
    difficultyCounts = { Mudah: 1, Sedang: 1, Sulit: 1 },
    dimensiKognitif = ["C1", "C2", "C3", "C4", "C5", "C6"],
    totalSoal = 3,
    jumlahOpsi = "ABCD"
  } = req.body;

  if (!subject || !topic) {
    return res.status(400).json({
      error: "Mata Pelajaran dan Topik/Lingkup Materi wajib diisi untuk melakukan generate!"
    });
  }

  // Option configuration based on bentukSoal and jumlahOpsi
  let numOptions = 4;
  let optionsLabels = ["A", "B", "C", "D"];
  if (bentukSoal === "Pilihan Ganda") {
    if (jumlahOpsi === "ABC") {
      numOptions = 3;
      optionsLabels = ["A", "B", "C"];
    } else if (jumlahOpsi === "ABCD") {
      numOptions = 4;
      optionsLabels = ["A", "B", "C", "D"];
    }
  }

  try {
    const ai = getGeminiClient();
    
    // Customize prompt instruction based on tambahGambar selector
    const imageInstruction = tambahGambar
      ? "Sertakan teks instruksi ilustrasi gambar di awal questionText dalam format markdown tebal, contoh: '**[GAMBAR: Ilustrasi diagram/skema pendukung terkait...]**' untuk memperkaya naskah soal."
      : "Jangan sertakan instruksi ilustrasi gambar.";

    // Customize prompt based on bentukSoal selector and jumlahOpsi config
    const bentukInstruction = `Bentuk Soal yang dipilih adalah: '${bentukSoal}'.
- Jika 'Pilihan Ganda', buatlah tepat ${numOptions} opsi pilihan ganda yang relevan dan saling bersaing ketat, dengan masing-masing opsi menggunakan kunci dari daftar: [${optionsLabels.join(", ")}].
- Jika 'Pilihan Ganda Kompleks', 'Menjodohkan', 'Isian Singkat', atau 'Uraian / Esai', buat lah format pertanyaan yang sesuai di 'questionText' (berikan teks petunjuk/soal esai yang mendalam), namun untuk kompatibilitas database sistem CBT kami tetap persiapkan array 'options' berisi tepat ${numOptions} kunci/pilihan opsi dengan label [${optionsLabels.join(", ")}], dan ulas kunci pengerjaan lengkap secara mendalam di bagian 'explanation' (Pembahasan).`;

    const difficultyDistributionText = activeDifficulties.map((lvl: string) => {
      const count = difficultyCounts[lvl as keyof typeof difficultyCounts] || 0;
      return `- Tingkat Kesulitan '${lvl}': sebanyak ${count} soal`;
    }).join("\n");

    const kognitifText = dimensiKognitif.join(", ");

    const prompt = `Buatlah tepat ${totalSoal} butir soal terstruktur, formal, akademis, dan bermutu tinggi dalam Bahasa Indonesia sesuai dengan parameter kurikulum Kurikulum Merdeka (tipe AKM) berikut:
- Jenjang Pendidikan: ${jenjang || "SD/MI/Sederajat"}
- Fase Pembelajaran: ${fase || "Fase B"}
- Kelas: ${kelas || "Kelas 4"}
- Mata Pelajaran (Mapel): ${subject}
- Topik / Lingkup Materi Bahasan: ${topic}

Aturan Tingkat Kesulitan Soal (Distribusikan ${totalSoal} butir soal dengan proporsi berikut):
${difficultyDistributionText}

Batasan Dimensi Kognitif (Gunakan dimensi kognitif dari daftar pilihan ini saja):
- Daftar pilihan aktif: [${kognitifText}]

${bentukInstruction}
${imageInstruction}

Setiap objek soal dalam array JSON wajib memuat properti:
1. questionText: Susun teks ini dengan format stimulus Kurikulum Merdeka yang rapi. Tampilkan tingkat kesulitan dan dimensi kognitif di awal teks, kemudian sajikan stimulus yang kaya dan diakhiri dengan pertanyaan terpilih yang ringkas, tepat sasaran, dan akurat. Struktur teks wajib ditulis persis mengikuti pola di bawah ini (pisahkan dengan baris kosong):

(Kesulitan: [Mudah/Sedang/Sulit], Dimensi: [C1-C6])
STIMULUS:
[Tulis paragraf stimulus kontekstual yang mendidik, relevan, berupa wacana informatif, cuplikan data/tabel, atau skenario simulasi nyata]

PERTANYAAN:
[Tulis satu kalimat pertanyaan yang sangat tepat, tajam, terarah, langsung, dan tidak bertele-tele]

2. options: Array tepat berisi ${numOptions} buah objek opsi jawaban. Masing-masing objek memuat property key dari daftar [${optionsLabels.join(", ")}] dan text penjelasan opsinya.
3. correctAnswer: Kunci jawaban bermutu prima yang benar, tunggal berupa string dari salah satu daftar [${optionsLabels.join(", ")}].
4. explanation: Penjelasan ringkas diawali dengan kata 'Pembahasan:' yang menguraikan alasan jawaban secara rinci dan berbobot akademis tinggi.

Kembalikan respon murni terformat sebagai array JSON berisi tepat ${totalSoal} objek soal sesuai struktur properti tersebut.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              questionText: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    key: { type: Type.STRING },
                    text: { type: Type.STRING }
                  },
                  required: ["key", "text"]
                }
              },
              correctAnswer: { type: Type.STRING },
              explanation: { type: Type.STRING }
            },
            required: ["questionText", "options", "correctAnswer", "explanation"]
          }
        }
      }
    });

    const text = response.text || "";
    const parsedQuestions = JSON.parse(text);
    return res.json({
      success: true,
      questions: parsedQuestions,
      source: "gemini-ai"
    });

  } catch (error: any) {
    console.log("Gemini Questions Generation: Menggunakan Fallback Engine karena:", error.message || error);
    
    const fallback = generateFallbackQuestions(jenjang, kelas, subject, topic);
    const adaptedFallback = [];
    const activeLvls = activeDifficulties && activeDifficulties.length > 0 ? activeDifficulties : ["Sedang"];
    const activeDims = dimensiKognitif && dimensiKognitif.length > 0 ? dimensiKognitif : ["C3"];
    
    for (let i = 0; i < totalSoal; i++) {
      const q = fallback[i % fallback.length];
      let qText = q.questionText;
      if (tambahGambar) {
        qText = `**[GAMBAR: Diagram Ilustrasi Konteks ${subject}]**\n\n` + qText;
      }
      const activeLvl = activeLvls[i % activeLvls.length];
      const activeDim = activeDims[i % activeDims.length];

      // Slice options to match numOptions
      const slicedOptions = q.options.slice(0, numOptions).map((opt, optIdx) => ({
        key: optionsLabels[optIdx],
        text: opt.text
      }));

      // Adjust correctAnswer to make sure it's within limits
      let correctAns = q.correctAnswer;
      if (!optionsLabels.includes(correctAns)) {
        correctAns = optionsLabels[0]; // fallback to "A" if index out of bound
      }

      adaptedFallback.push({
        ...q,
        questionText: `[${bentukSoal} - ${activeLvl} - ${activeDim}] ` + qText,
        options: slicedOptions,
        correctAnswer: correctAns
      });
    }

    return res.json({
      success: true,
      message: "GEMINI_API_KEY belum terkonfigurasi di Google AI Studio Settings. Menggunakan fallback template otomatis.",
      questions: adaptedFallback,
      source: "fallback-engine"
    });
  }
});

// Sub-routine to sync local array to Firestore, resolving deletes
async function syncCollectionToFirestore(collectionName: string, items: any[]) {
  if (!items || !Array.isArray(items)) return;
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    const dbIds = new Set<string>();
    querySnapshot.forEach((doc) => {
      dbIds.add(doc.id);
    });

    const activeIds = new Set<string>();
    for (const item of items) {
      if (item && item.id) {
        activeIds.add(item.id);
        const ref = doc(db, collectionName, item.id);
        await setDoc(ref, item);
      }
    }

    // Delete elements from DB that do not exist anymore in memory (to sync deletions)
    for (const id of dbIds) {
      if (!activeIds.has(id)) {
        console.log(`[Firestore] Deleting orphaned document [${id}] from collection [${collectionName}]`);
        await deleteDoc(doc(db, collectionName, id));
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, collectionName);
  }
}

async function syncServerTimeConfigToFirestore(config: any) {
  if (!config) return;
  try {
    const ref = doc(db, "config", "serverTime");
    await setDoc(ref, config);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, "config/serverTime");
  }
}

async function initServerStateFromFirestore() {
  try {
    console.log("[Firestore] Connecting and initializing system state from cloud database...");

    // 1. Accounts
    const accountsRef = "accounts";
    try {
      const snap = await getDocs(collection(db, accountsRef));
      if (snap.empty) {
        console.log("[Firestore] Accounts empty. Bootstrapping with default accounts.");
        serverDbState.accounts = INITIAL_ACCOUNTS;
        for (const item of INITIAL_ACCOUNTS) {
          await setDoc(doc(db, accountsRef, item.id), item);
        }
      } else {
        const list: any[] = [];
        snap.forEach((doc) => list.push(doc.data()));
        serverDbState.accounts = list;
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, accountsRef);
    }

    // 2. Packages
    const packagesRef = "packages";
    try {
      const snap = await getDocs(collection(db, packagesRef));
      if (snap.empty) {
        console.log("[Firestore] Packages empty. Bootstrapping with default packages.");
        serverDbState.packages = INITIAL_PACKAGES;
        for (const item of INITIAL_PACKAGES) {
          await setDoc(doc(db, packagesRef, item.id), item);
        }
      } else {
        const list: any[] = [];
        snap.forEach((doc) => list.push(doc.data()));
        serverDbState.packages = list;
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, packagesRef);
    }

    // 3. Questions
    const questionsRef = "questions";
    try {
      const snap = await getDocs(collection(db, questionsRef));
      if (snap.empty) {
        console.log("[Firestore] Questions empty. Bootstrapping with default questions.");
        serverDbState.questions = INITIAL_QUESTIONS;
        for (const item of INITIAL_QUESTIONS) {
          await setDoc(doc(db, questionsRef, item.id), item);
        }
      } else {
        const list: any[] = [];
        snap.forEach((doc) => list.push(doc.data()));
        serverDbState.questions = list;
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, questionsRef);
    }

    // 4. Updates (Announcements)
    const updatesRef = "updates";
    try {
      const snap = await getDocs(collection(db, updatesRef));
      if (snap.empty) {
        console.log("[Firestore] Updates empty. Bootstrapping.");
        serverDbState.updates = INITIAL_UPDATES;
        for (const item of INITIAL_UPDATES) {
          await setDoc(doc(db, updatesRef, item.id), item);
        }
      } else {
        const list: any[] = [];
        snap.forEach((doc) => list.push(doc.data()));
        serverDbState.updates = list;
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, updatesRef);
    }

    // 5. Schedules
    const schedulesRef = "schedules";
    try {
      const snap = await getDocs(collection(db, schedulesRef));
      if (snap.empty) {
        console.log("[Firestore] Schedules empty. Bootstrapping.");
        serverDbState.schedules = INITIAL_SCHEDULES;
        for (const item of INITIAL_SCHEDULES) {
          await setDoc(doc(db, schedulesRef, item.id), item);
        }
      } else {
        const list: any[] = [];
        snap.forEach((doc) => list.push(doc.data()));
        serverDbState.schedules = list;
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, schedulesRef);
    }

    // 6. History (Reset and keep pristine status to prevent old student history records from persisting)
    const historyRef = "history";
    try {
      const snap = await getDocs(collection(db, historyRef));
      for (const snapDoc of snap.docs) {
        await deleteDoc(doc(db, historyRef, snapDoc.id));
      }
      serverDbState.history = [];
    } catch (e) {
      console.warn("[Firestore] Failed to fully clear history on boot, falling back to empty array", e);
      serverDbState.history = [];
    }

    // 7. Participants (Automatically cleaned up and reset on boot to ensure no stale student participant entries remain)
    const participantsRef = "participants";
    try {
      const snap = await getDocs(collection(db, participantsRef));
      for (const snapDoc of snap.docs) {
        await deleteDoc(doc(db, participantsRef, snapDoc.id));
      }
      serverDbState.participants = [];
    } catch (e) {
      console.warn("[Firestore] Failed to fully clear participants on boot, falling back to empty array", e);
      serverDbState.participants = [];
    }

    // 8. Activity logs
    const activityLogsRef = "activityLogs";
    try {
      const snap = await getDocs(collection(db, activityLogsRef));
      const list: any[] = [];
      snap.forEach((doc) => list.push(doc.data()));
      serverDbState.activityLogs = list;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, activityLogsRef);
    }

    // 9. Server Time Config
    const timeRef = "config/serverTime";
    try {
      const docSnap = await getDoc(doc(db, "config", "serverTime"));
      if (!docSnap.exists()) {
        const defaultTime = { useManualTime: false, offsetMs: 0 };
        await setDoc(doc(db, "config", "serverTime"), defaultTime);
        serverDbState.serverTimeConfig = defaultTime;
      } else {
        serverDbState.serverTimeConfig = docSnap.data() as any;
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, timeRef);
    }

    console.log("[Firestore] Database successfully loaded into memory.");
  } catch (err) {
    console.error("[Firestore] Heavy bootup initialization error. Using local fallbacks.", err);
    // Safe memory fallbacks
    serverDbState.packages = serverDbState.packages || INITIAL_PACKAGES;
    serverDbState.questions = serverDbState.questions || INITIAL_QUESTIONS;
    serverDbState.updates = serverDbState.updates || INITIAL_UPDATES;
    serverDbState.history = serverDbState.history || [];
    serverDbState.participants = serverDbState.participants || [];
    serverDbState.schedules = serverDbState.schedules || INITIAL_SCHEDULES;
    serverDbState.accounts = serverDbState.accounts || INITIAL_ACCOUNTS;
    serverDbState.activityLogs = serverDbState.activityLogs || [];
    serverDbState.serverTimeConfig = serverDbState.serverTimeConfig || { useManualTime: false, offsetMs: 0 };
  }
}

// Setup Vite Dev Server / Static files handler
async function serveApp() {
  console.log("Loading cloud database content...");
  await initServerStateFromFirestore();

  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode with static build assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is booted and listening on host 0.0.0.0, port ${PORT}`);
  });
}

serveApp();
