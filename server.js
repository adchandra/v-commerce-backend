import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";

/* =========================
   Session Start & Setup
   ========================= */
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/* Keamanan & Kinerja */
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(compression());
app.use(cors({
  origin: "*", // sesuaikan jika perlu
  methods: ["POST", "GET", "OPTIONS"],
}));
app.use(morgan("combined"));
app.use(express.json({ limit: "1mb" }));

/* Rate Limit untuk proteksi API */
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 menit
  max: 60,             // 60 request/menit/IP
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

/* Static file untuk gambar produk (letakkan file di /public/images) */
app.use("/public", express.static(path.join(__dirname, "public")));

/* =========================
   Data & Konstanta
   ========================= */

/** Prompt dasar — menjaga NPC hanya bicara soal daftar produk */
const basePrompt = `
Kamu adalah NPC penjual oleh-oleh khas Yogyakarta di dunia virtual. Tugasmu adalah menjelaskan produk oleh-oleh dengan sopan dan ramah kepada pengunjung.

Berikut adalah daftar produk oleh-oleh yang tersedia:

1. Bakpia Pathok 25 — Rp 25.000/box: Kue isi kacang hijau yang lembut dan manis, ikon oleh-oleh Jogja.
2. Geplak — Rp 10.000/paket: Makanan manis dari kelapa parut dan gula warna-warni.
3. Yangko — Rp 15.000/box: Kue kenyal seperti mochi, berbahan tepung ketan dan isi kacang.
4. Gudeg Kaleng — Rp 30.000/kaleng: Gudeg praktis siap saji khas Jogja, tahan lama untuk dibawa pulang.
5. Cokelat Monggo — Rp 50.000/bungkus: Cokelat premium khas Jogja dengan berbagai varian rasa (green tea, chili, durian).
6. Batik Jumputan Mini — Rp 35.000/paket: Cenderamata kain batik mini sebagai oleh-oleh unik.
7. Kopi Joss — Rp 5.000/sachet: Kopi khas Jogja yang disajikan dengan arang membara langsung dalam gelas.

Jawablah pertanyaan hanya berdasarkan produk di atas. Jika ditanya hal lain di luar daftar, tolak dengan sopan dan katakan kamu hanya melayani pertanyaan tentang oleh-oleh di toko ini.
`;

/** Katalog produk — untuk deteksi & metadata */
const PRODUCTS = [
  {
    key: "bakpia",
    names: ["bakpia", "bakpia pathok", "bakpia pathok 25", "pathok 25"],
    title: "Bakpia Pathok 25",
    price: "Rp 25.000/box",
    image: "/public/images/bakpia.jpg",
  },
  {
    key: "geplak",
    names: ["geplak"],
    title: "Geplak",
    price: "Rp 10.000/paket",
    image: "/public/images/geplak.jpg",
  },
  {
    key: "yangko",
    names: ["yangko"],
    title: "Yangko",
    price: "Rp 15.000/box",
    image: "/public/images/yangko.jpg",
  },
  {
    key: "gudeg",
    names: ["gudeg kaleng", "gudeg", "gudeg siap saji"],
    title: "Gudeg Kaleng",
    price: "Rp 30.000/kaleng",
    image: "/public/images/gudeg-kaleng.jpg",
  },
  {
    key: "monggo",
    names: ["cokelat monggo", "coklat monggo", "monggo"],
    title: "Cokelat Monggo",
    price: "Rp 50.000/bungkus",
    image: "/public/images/cokelat-monggo.jpg",
  },
  {
    key: "batik",
    names: ["batik jumputan mini", "batik jumputan", "batik"],
    title: "Batik Jumputan Mini",
    price: "Rp 35.000/paket",
    image: "/public/images/batik-jumputan-mini.jpg",
  },
  {
    key: "kopijoss",
    names: ["kopi joss", "kopi jos", "kopi arang"],
    title: "Kopi Joss",
    price: "Rp 5.000/sachet",
    image: "/public/images/kopi-joss.jpg",
  },
];

/* =========================
   Validasi & Utilitas
   ========================= */

/** Skema validasi body request */
const AskSchema = z.object({
  message: z.string().min(1, "Pesan kosong tidak diizinkan.").max(1000),
});

/** 
 * Fungsi: normalisasi string 
 * Tujuan: menghindari mismatch saat deteksi produk
 */
function normalize(str = "") {
  return str.toLowerCase().normalize("NFKD").replace(/\s+/g, " ").trim();
}

/** 
 * Fungsi: deteksi produk dari pesan user
 * Tujuan: menentukan apakah perlu menyertakan gambar spesifik
 */
function detectProduct(message) {
  const text = normalize(message);
  for (const p of PRODUCTS) {
    for (const name of p.names) {
      if (text.includes(normalize(name))) return p;
    }
  }
  return null;
}

/** 
 * Fungsi: buat sistem instruksi/prompt untuk Gemini
 * Tujuan: konsisten, aman, dan tetap di konteks daftar produk
 */
function buildSystemInstruction() {
  return basePrompt;
}

/** 
 * Fungsi: buat konten user untuk model
 * Tujuan: menyertakan guardrail tambahan agar menolak di luar topik
 */
function buildUserContent(message) {
  return `
Pertanyaan pengunjung:
"${message}"

Ingat: Jawab hanya berdasarkan 7 produk yang sudah ditentukan. 
Jika di luar itu, tolak dengan sopan sesuai instruksi.
Balas singkat, ramah, dan informatif.`;
}

/** 
 * Fungsi: delay util untuk retry (exponential backoff)
 */
function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

/* =========================
   Inisialisasi Gemini
   ========================= */

const API_KEY = process.env.GOOGLE_API_KEY;
if (!API_KEY) {
  console.error("GOOGLE_API_KEY belum disetel di environment.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

/** 
 * Fungsi: membuat instance model generatif
 * Tujuan: memisahkan konfigurasi model (mudah diganti)
 */
function getModel() {
  // 1.5-flash cepat & ekonomis; bisa ganti ke 1.5-pro untuk kualitas lebih tinggi
  return genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
    systemInstruction: buildSystemInstruction(),
  });
}

/** 
 * Fungsi: panggil Gemini dengan timeout & retry
 * Tujuan: andal terhadap gangguan jaringan
 */
async function generateWithRetry(userMessage, { retries = 2, timeoutMs = 12000 } = {}) {
  let attempt = 0;
  let lastErr;

  while (attempt <= retries) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);

      const model = getModel();
      const result = await model.generateContent(
        [{ text: buildUserContent(userMessage) }],
        { signal: controller.signal }
      );

      clearTimeout(id);

      const text = result?.response?.text?.() ?? result?.response?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      if (!text) throw new Error("Kosong: model tidak mengembalikan teks.");
      return text.trim();
    } catch (err) {
      lastErr = err;
      // Exponential backoff: 500ms, 1000ms, 2000ms...
      const backoff = 500 * Math.pow(2, attempt);
      await sleep(backoff);
      attempt++;
      if (attempt > retries) break;
    }
  }
  throw lastErr || new Error("Gagal menghubungi model.");
}

/* =========================
   Route API (tetap sama)
   ========================= */

/**
 * POST /api/ask-npc
 * - Memproses pertanyaan pengguna
 * - Menjawab via Gemini sesuai daftar produk
 * - Mengembalikan image URL jika pertanyaan menyebut produk tertentu
 */
app.post("/api/ask-npc", async (req, res) => {
  // Validasi input
  const parsed = AskSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0]?.message || "Input tidak valid." });
  }
  const message = parsed.data.message?.toString().trim();

  try {
    // Deteksi produk untuk penyertaan gambar
    const product = detectProduct(message);

    // Panggil Gemini (dengan retry & timeout)
    const reply = await generateWithRetry(message, { retries: 2, timeoutMs: 12000 });

    // Susun payload respons (kompatibel & diperluas)
    const payload = {
      response: reply,
      // sertakan metadata dasar supaya client bisa menampilkan UI lebih kaya
      meta: {
        model: "gemini-1.5-flash",
        lang: "id",
        containsProduct: Boolean(product),
      },
    };

    // Jika ada produk terdeteksi, kirim image & info produk
    if (product) {
      payload.product = {
        key: product.key,
        title: product.title,
        price: product.price,
      };
      payload.images = [product.image]; // bisa diperluas jadi beberapa gambar/varian
    }

    return res.json(payload);
  } catch (err) {
    // Logging error tanpa membocorkan detail sensitif
    console.error("Ask NPC Error:", err?.response?.data || err?.message || err);

    // Pesan fallback yang sopan dan aman
    return res.status(502).json({
      error: "Terjadi gangguan saat memproses permintaan.",
      hint: "Silakan coba lagi sebentar lagi.",
    });
  }
});

/* =========================
   Healthcheck sederhana
   ========================= */

/**
 * GET /health
 * - Memastikan layanan hidup
 */
app.get("/health", (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

/* =========================
   Server Start (Footer)
   ========================= */
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
