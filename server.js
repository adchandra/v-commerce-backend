// server.js
// Server NPC oleh-oleh Jogja yang lebih interaktif dan asik
// -----------------------------------------------
// Fitur baru:
// 1) Sistem percakapan yang lebih natural
// 2) Context-aware responses
// 3) Personality yang lebih hidup
// 4) Response yang bervariasi berdasarkan mood dan situasi
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
app.use(express.static(path.join(__dirname, "public")));

// =====================================================
// KATALOG PRODUK (sama seperti sebelumnya tapi dengan detail lebih)
// =====================================================
const PRODUCT_CATALOG = [
  {
    id: "bakpia-pathok-25",
    name: "Bakpia Pathok 25",
    price: 25000,
    unit: "box",
    description: "Kue isi kacang hijau yang lembut dan manis, ikon oleh-oleh Jogja.",
    story: "Sudah ada sejak tahun 1948, resep turun-temurun yang masih autentik!",
    tips: "Enak dimakan hangat dengan teh atau kopi. Bisa tahan 3-4 hari tanpa pengawet.",
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
    description: "Makanan manis dari kelapa parut dan gula warna-warni, legit dan klasik.",
    story: "Camilan legendaris yang sudah ada dari zaman nenek moyang, warna-warninya bikin happy!",
    tips: "Simpan di tempat kering, makin lama makin keras tapi tetep enak. Ada yang suka dicelup teh!",
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
    description: "Kue kenyal seperti mochi, berbahan tepung ketan dengan isi kacang.",
    story: "Pengaruh budaya Tionghoa yang udah melebur jadi makanan khas Jogja!",
    tips: "Paling enak dimakan fresh, teksturnya lembut dan kenyal. Jangan lupa cuci tangan dulu!",
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
    description: "Gudeg praktis siap saji khas Jogja, tahan lama dan cocok untuk dibawa pulang.",
    story: "Inovasi modern dari masakan tradisional, biar bisa ngerasain gudeg di mana aja!",
    tips: "Panaskan dulu sebelum dimakan, tambahin sambal krecek kalau ada. Tahan berbulan-bulan!",
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
    description: "Cokelat premium khas Jogja dengan berbagai varian (green tea, chili, durian).",
    story: "Brand lokal yang go international! Bangga banget sama cokelat buatan anak bangsa.",
    tips: "Coba yang rasa chili, unik banget! Simpan di kulkas biar ga meleleh. Cocok buat hadiah.",
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
    description: "Cenderamata kain batik mini yang unik, cocok untuk buah tangan.",
    story: "Teknik jumputan ini art banget, setiap piece punya motif yang beda-beda!",
    tips: "Bisa dijadiin hiasan dinding, pembatas buku, atau souvenir. Awet dan bermakna!",
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
    description: "Kopi khas Jogja yang disajikan dengan arang membara langsung dalam gelas.",
    story: "Awalnya cuma experiment seorang pedagang, sekarang jadi viral dan jadi ciri khas Jogja!",
    tips: "Jangan kaget sama arangnya, itu yang bikin rasanya beda! Diminum selagi hangat ya.",
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
// SISTEM PERSONALITY & CONTEXT
// =====================================================
const PERSONALITY_TRAITS = {
  friendly: [
    "Halo kak! 😊",
    "Wah, ada yang mau belanja oleh-oleh nih!",
    "Selamat datang di toko oleh-oleh Jogja terbaik!",
    "Gimana kabarnya kak? Lagi nyari oleh-oleh ya?"
  ],
  enthusiastic: [
    "Wah, pilihan yang mantap banget!",
    "Ini favorit banyak orang loh!",
    "Kak pasti bakal suka deh sama ini!",
    "Recommended banget ini!"
  ],
  helpful: [
    "Ada yang bisa aku bantuin lagi?",
    "Kalau mau tanya-tanya lagi, monggo kak!",
    "Semoga cocok sama seleramu ya!",
    "Jangan ragu kalau mau konsultasi lagi!"
  ],
  storyteller: [
    "Eh tau ga sih kak, ini ada cerita menariknya...",
    "Fun fact nih tentang produk ini...",
    "Dulu waktu pertama kali nyoba ini...",
    "Banyak customer cerita kalau..."
  ]
};

const CONTEXT_RESPONSES = {
  first_time: "Wah, pertama kali ke Jogja ya kak? Selamat datang! 🎉",
  budget_conscious: "Tenang kak, ada yang murah-murah tapi tetep berkualitas kok!",
  gift_shopping: "Oh buat hadiah ya? Wah pasti orangnya bahagia banget!",
  food_lover: "Kayaknya kak suka kuliner nih! Perfect, Jogja surganya makanan enak!",
  curious: "Wah, curious banget! Aku seneng explain-explain tentang produk-produk ini!",
  comparing: "Bingung pilih yang mana? Aku bantuin bandingin yuk!"
};

// =====================================================
// ENHANCED PROMPT SYSTEM
// =====================================================
function createDynamicPrompt(userMessage, conversationHistory = []) {
  // Analisis sederhana pesan user
  const messageAnalysis = analyzeUserMessage(userMessage);
  
  const basePersonality = `
Kamu adalah Mbak Sari, penjual oleh-oleh khas Yogyakarta yang super ramah, enthusiastic, dan suka cerita!

KEPRIBADIAN:
- Bicara santai tapi sopan, pakai bahasa gaul yang natural
- Suka kasih tips dan cerita menarik tentang produk
- Enthusiastic banget sama produk yang dijual
- Helpful dan sabar jawab pertanyaan
- Kadang pakai emoji yang pas (jangan berlebihan)
- Suka ngasih rekomendasi berdasarkan kebutuhan customer

CARA BICARA:
- Panggil customer dengan "kak" 
- Pakai "aku" untuk diri sendiri
- Bahasa Indonesia yang natural, campur sedikit bahasa gaul
- Jangan terlalu formal, tapi tetap sopan
- Kasih variasi dalam menyapa dan merespons

ATURAN PENTING:
1. HANYA bahas produk yang ada di katalog
2. Selalu sertakan gambar dengan format: ![nama produk](url gambar)
3. Kasih link tempat beli kalau customer tertarik
4. Jangan paksa beli, tapi kasih info yang menarik
5. Kalau ditanya produk yang ga ada, arahkan ke yang serupa atau bilang belum tersedia

Context dari pesan user: ${messageAnalysis.context}
Mood yang dideteksi: ${messageAnalysis.mood}
`;

  return basePersonality + `

KATALOG PRODUK:
${JSON.stringify(PRODUCT_CATALOG, null, 2)}

Conversation history: ${JSON.stringify(conversationHistory.slice(-3), null, 2)}
`;
}

function analyzeUserMessage(message) {
  const lowerMessage = message.toLowerCase();
  
  // Deteksi context
  let context = "general";
  if (lowerMessage.includes("pertama kali") || lowerMessage.includes("first time")) {
    context = "first_time";
  } else if (lowerMessage.includes("murah") || lowerMessage.includes("budget")) {
    context = "budget_conscious";
  } else if (lowerMessage.includes("hadiah") || lowerMessage.includes("gift")) {
    context = "gift_shopping";
  } else if (lowerMessage.includes("enak") || lowerMessage.includes("makanan")) {
    context = "food_lover";
  } else if (lowerMessage.includes("apa itu") || lowerMessage.includes("gimana")) {
    context = "curious";
  } else if (lowerMessage.includes("atau") || lowerMessage.includes("vs")) {
    context = "comparing";
  }

  // Deteksi mood
  let mood = "neutral";
  if (lowerMessage.includes("excited") || lowerMessage.includes("senang")) {
    mood = "excited";
  } else if (lowerMessage.includes("bingung") || lowerMessage.includes("confused")) {
    mood = "confused";
  }

  return { context, mood };
}

// =====================================================
// CONVERSATION MEMORY (simple in-memory storage)
// Untuk production, gunakan Redis atau database
// =====================================================
const conversationMemory = new Map();

function getConversationHistory(sessionId) {
  return conversationMemory.get(sessionId) || [];
}

function addToConversationHistory(sessionId, userMessage, aiResponse) {
  const history = getConversationHistory(sessionId);
  history.push(
    { role: "user", content: userMessage, timestamp: Date.now() },
    { role: "assistant", content: aiResponse, timestamp: Date.now() }
  );
  
  // Keep only last 10 messages to avoid memory issues
  if (history.length > 10) {
    history.splice(0, history.length - 10);
  }
  
  conversationMemory.set(sessionId, history);
}

// =====================================================
// ENHANCED ENDPOINT
// =====================================================
app.post("/api/ask-npc", async (req, res) => {
  const { message, sessionId = "default" } = req.body;

  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "Pesan kosong tidak diizinkan." });
  }

  try {
    const conversationHistory = getConversationHistory(sessionId);
    const dynamicPrompt = createDynamicPrompt(message, conversationHistory);
    
    // Build messages with conversation history
    const messages = [
      { role: "system", content: dynamicPrompt },
      ...conversationHistory.slice(-6), // Last 3 exchanges
      { role: "user", content: message }
    ];

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o-mini",
        messages: messages,
        temperature: 0.8, // Lebih creative
        top_p: 0.9,
        max_tokens: 800,
        presence_penalty: 0.1, // Avoid repetition
        frequency_penalty: 0.1
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.APP_PUBLIC_URL || "http://localhost:3000",
          "X-Title": "V-Commerce Interactive NPC",
        },
        timeout: 30000,
      }
    );

    const reply = response.data?.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return res.status(502).json({ error: "Jawaban kosong dari model." });
    }

    // Security: basic XSS prevention
    const sanitizedReply = reply.replace(
      /\]\((javascript:|data:|vbscript:)/gi,
      "](#blocked)"
    );

    // Save to conversation history
    addToConversationHistory(sessionId, message, sanitizedReply);

    res.json({ 
      response: sanitizedReply,
      sessionId: sessionId,
      conversationLength: getConversationHistory(sessionId).length
    });

  } catch (err) {
    console.error("Error:", err.response?.data || err.message);
    
    // Fallback response jika API error
    const fallbackResponses = [
      "Wah, maaf kak lagi ada gangguan sebentar. Tapi aku tetap siap bantu! Coba tanya lagi yuk tentang oleh-oleh yang mau dicari 😊",
      "Oops, connection lagi bermasalah nih. Tapi jangan khawatir, aku masih di sini! Ada yang mau ditanyain tentang produk kita?",
      "Sorry kak, sistemnya lagi hiccup sebentar. Tapi aku masih semangat kok buat bantuin cari oleh-oleh terbaik! 🎁"
    ];
    
    const fallbackResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    
    res.status(200).json({ 
      response: fallbackResponse,
      isError: true,
      sessionId: sessionId 
    });
  }
});

// =====================================================
// ADDITIONAL ENDPOINTS
// =====================================================

// Get conversation history
app.get("/api/conversation/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  const history = getConversationHistory(sessionId);
  res.json({ history, count: history.length });
});

// Clear conversation
app.delete("/api/conversation/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  conversationMemory.delete(sessionId);
  res.json({ message: "Conversation cleared", sessionId });
});

// Get products with enhanced info
app.get("/api/products", (req, res) => {
  res.json({
    products: PRODUCT_CATALOG,
    count: PRODUCT_CATALOG.length,
    categories: [...new Set(PRODUCT_CATALOG.map(p => p.category || 'makanan'))],
    totalActiveConversations: conversationMemory.size
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    activeConversations: conversationMemory.size,
    productCount: PRODUCT_CATALOG.length
  });
});

// =====================================================
// START SERVER
// =====================================================
app.listen(PORT, () => {
  console.log(`🚀 Interactive NPC Server running on port ${PORT}`);
  console.log(`📦 Loaded ${PRODUCT_CATALOG.length} products`);
  console.log(`🤖 Mbak Sari siap melayani!`);
});