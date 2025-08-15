// server.js
// Server NPC oleh-oleh Jogja dengan dukungan gambar & link toko
// -----------------------------------------------
// Fitur utama:
// 1) Katalog produk dengan imageUrl & buyLinks
// 2) Prompt yang memaksa AI menyertakan gambar & link saat relevan
// 3) Endpoint /api/ask-npc untuk tanya-jawab
// 4) Endpoint /api/products untuk melihat katalog
// -----------------------------------------------

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const PORT = process.env.PORT || 3002;
const BASE_URL = process.env.ASSET_BASE_URL || `http://localhost:${PORT}`;

// Setup dasar
const app = express();
app.use(cors());
app.use(express.json());

// Konfigurasi static files untuk gambar
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Pastikan kamu punya folder ./public/images dan simpan gambar produk di sana
app.use(express.static(path.join(__dirname, "public")));

// =====================================================
// 1) KATALOG PRODUK (edit sesuai kebutuhanmu)
// - imageUrl bisa berupa jalur statis (mis. /images/bakpia.jpg)
// - buyLinks: daftar situs tempat beli (tokomu sendiri, marketplace, dsb.)
// =====================================================
const PRODUCT_CATALOG = [
  {
    id: "bakpia-pathok-25",
    name: "Bakpia Pathok 25",
    price: 25000,
    unit: "box",
    description:
      "Kue isi kacang hijau yang lembut dan manis, ikon oleh-oleh Jogja.",
    imageUrl: `${BASE_URL}/images/bakpia.jpg`,
    buyLinks: [
      {
        title: "Tokopedia - Bakpia Pathok 25",
        url: "https://www.tokopedia.com/search?st=product&q=bakpia%20pathok%2025",
      },
      {
        title: "Shopee - Bakpia Pathok 25",
        url: "https://shopee.co.id/search?keyword=bakpia%20pathok%2025",
      },
    ],
  },
  {
    id: "geplak",
    name: "Geplak",
    price: 10000,
    unit: "paket",
    description:
      "Makanan manis dari kelapa parut dan gula warna-warni, legit dan klasik.",
    imageUrl: `${BASE_URL}/images/geplak.jpg`,
    buyLinks: [
      {
        title: "Tokopedia - Geplak Jogja",
        url: "https://www.tokopedia.com/search?st=product&q=geplak%20jogja",
      },
      {
        title: "Shopee - Geplak Jogja",
        url: "https://shopee.co.id/search?keyword=geplak%20jogja",
      },
    ],
  },
  {
    id: "yangko",
    name: "Yangko",
    price: 15000,
    unit: "box",
    description:
      "Kue kenyal seperti mochi, berbahan tepung ketan dengan isi kacang.",
    imageUrl: `${BASE_URL}/images/yangko.jpg`,
    buyLinks: [
      {
        title: "Tokopedia - Yangko",
        url: "https://www.tokopedia.com/search?st=product&q=yangko%20jogja",
      },
      {
        title: "Shopee - Yangko",
        url: "https://shopee.co.id/search?keyword=yangko%20jogja",
      },
    ],
  },
  {
    id: "gudeg-kaleng",
    name: "Gudeg Kaleng",
    price: 30000,
    unit: "kaleng",
    description:
      "Gudeg praktis siap saji khas Jogja, tahan lama dan cocok untuk dibawa pulang.",
    imageUrl: `${BASE_URL}/images/gudeg-kaleng.jpg`,
    buyLinks: [
      {
        title: "Tokopedia - Gudeg Kaleng",
        url: "https://www.tokopedia.com/search?st=product&q=gudeg%20kaleng",
      },
      {
        title: "Shopee - Gudeg Kaleng",
        url: "https://shopee.co.id/search?keyword=gudeg%20kaleng",
      },
    ],
  },
  {
    id: "cokelat-monggo",
    name: "Cokelat Monggo",
    price: 50000,
    unit: "bungkus",
    description:
      "Cokelat premium khas Jogja dengan berbagai varian (green tea, chili, durian).",
    imageUrl: `${BASE_URL}/images/cokelat-monggo.jpg`,
    buyLinks: [
      {
        title: "Tokopedia - Cokelat Monggo",
        url: "https://www.tokopedia.com/search?st=product&q=cokelat%20monggo",
      },
      {
        title: "Shopee - Cokelat Monggo",
        url: "https://shopee.co.id/search?keyword=cokelat%20monggo",
      },
    ],
  },
  {
    id: "batik-jumputan-mini",
    name: "Batik Jumputan Mini",
    price: 35000,
    unit: "paket",
    description:
      "Cenderamata kain batik mini yang unik, cocok untuk buah tangan.",
    imageUrl: `${BASE_URL}/images/batik-jumputan-mini.jpg`,
    buyLinks: [
      {
        title: "Tokopedia - Batik Jumputan",
        url: "https://www.tokopedia.com/search?st=product&q=batik%20jumputan",
      },
      {
        title: "Shopee - Batik Jumputan",
        url: "https://shopee.co.id/search?keyword=batik%20jumputan",
      },
    ],
  },
  {
    id: "kopi-joss",
    name: "Kopi Joss",
    price: 5000,
    unit: "sachet",
    description:
      "Kopi khas Jogja yang disajikan dengan arang membara langsung dalam gelas.",
    imageUrl: `${BASE_URL}/images/kopi-joss.jpg`,
    buyLinks: [
      {
        title: "Tokopedia - Kopi Joss",
        url: "https://www.tokopedia.com/search?st=product&q=kopi%20joss",
      },
      {
        title: "Shopee - Kopi Joss",
        url: "https://shopee.co.id/search?keyword=kopi%20joss",
      },
    ],
  },
];

// =====================================================
// 2) BASE PROMPT + INSTRUKSI OUTPUT
// - Menetapkan gaya bicara
// - Memaksa AI untuk menyertakan gambar dan link ketika relevan
// - Membatasi topik hanya pada produk katalog
// =====================================================
const basePrompt = `
Kamu adalah NPC penjual oleh-oleh khas Yogyakarta.
Jawab HANYA tentang produk di katalog berikut, dengan format Markdown persis seperti ini:

---

**<Nama Produk> — Rp <harga>/<unit>**

![<Nama Produk>](<imageUrl>)

**Deskripsi:**  
<deskripsi produk>

**Tempat Beli:**  
- [<Nama Toko 1>](<URL 1>)  
- [<Nama Toko 2>](<URL 2>)

---

Katalog:
${JSON.stringify(PRODUCT_CATALOG, null, 2)}
`;



// Utility: buat pesan sistem + katalog agar model tahu data gambar/link
function buildMessages(userMessage) {
  return [
    { role: "system", content: basePrompt },
    {
      role: "system",
      // Katalog diberikan sebagai konteks yang boleh dirujuk model
      content:
        "KATALOG PRODUK (JSON):\n" + JSON.stringify(PRODUCT_CATALOG, null, 2),
    },
    { role: "user", content: userMessage },
  ];
}

// =====================================================
// 3) ENDPOINT TANYA-JAWAB
// - Memanggil OpenRouter Chat Completions
// - Mengirim basePrompt + katalog ke model
// - Mengembalikan teks balasan model (dengan gambar & link)
// =====================================================
app.post("/api/ask-npc", async (req, res) => {
  const { message } = req.body;

  // Validasi input
  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "Pesan kosong tidak diizinkan." });
  }

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o-mini", // ganti jika perlu
        messages: buildMessages(message),
        // Sedikit pengaturan agar hasil lebih stabil
        temperature: 0.6,
        top_p: 0.9,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          // Dua header ini PENTING untuk produksi:
          "HTTP-Referer":
            process.env.APP_PUBLIC_URL ||
            "https://v-commerce-frontend.example.com",
          "X-Title": "V-Commerce NPC",
        },
        timeout: 30000,
      }
    );

    // Defensive: pastikan ada output
    const choice = response.data?.choices?.[0];
    const reply = choice?.message?.content?.trim();
    if (!reply) {
      console.error("OpenRouter response tanpa content:", response.data);
      return res.status(502).json({
        error: "Jawaban kosong dari model.",
        detail: response.data,
      });
    }

    // (Opsional) Filter minimal: cegah URL non-HTTP/HTTPS
    // Catatan: ini hanya contoh sederhana; sesuaikan kebutuhan keamananmu.
    const sanitizedReply = reply.replace(
      /\]\((javascript:|data:)/gi,
      "](#blocked)"
    );

    res.json({ response: sanitizedReply });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({
      error: "Terjadi kesalahan.",
      detail: err.response?.data || err.message,
    });
  }
});

// =====================================================
// 4) ENDPOINT CEK KATALOG (untuk frontend)
// =====================================================
app.get("/api/products", (req, res) => {
  res.json({
    products: PRODUCT_CATALOG,
    count: PRODUCT_CATALOG.length,
  });
});

// =====================================================
// 5) START SERVER
// =====================================================
app.listen(PORT, () => console.log(`Server berjalan di port ${PORT}`));
