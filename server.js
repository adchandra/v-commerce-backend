import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Inisialisasi client OpenAI versi 4
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

app.post("/api/ask-npc", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Pesan kosong tidak diizinkan." });
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: basePrompt },
        { role: "user", content: message }
      ],
    });

    const reply = response.choices[0].message.content.trim();
    res.json({ response: reply });
  } catch (err) {
    res.status(500).json({ error: "Terjadi kesalahan.", detail: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
