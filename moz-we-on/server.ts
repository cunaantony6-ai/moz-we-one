import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser with high limit for mock/base64 music uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Initialize Gemini Client Lazily to prevent startup crash if API key is missing
let aiClient: any = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY environment variable is missing. AI features will run in mock offline mode.");
      return null;
    }
    try {
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    } catch (e) {
      console.error("Failed to initialize Gemini Client:", e);
      return null;
    }
  }
  return aiClient;
}

// Generate random waveform peaks for visual styling
function generateWaveform(count = 40): number[] {
  return Array.from({ length: count }, () => Math.round((0.1 + Math.random() * 0.9) * 100) / 100);
}

// In-memory Database for tracks
let tracks = [
  {
    id: "track-1",
    title: "Keta Moçambique",
    artist: "Mr. Bow",
    genre: "Marrabenta",
    description: "Uma celebração moderna dos ritmos tradicionais de Marrabenta. Sinta a guitarra quente do sul de Moçambique!",
    audioUrl: "synth:marrabenta_guitar", // procedural synth preset for playback
    coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=60",
    duration: 180,
    likesCount: 342,
    playCount: 1540,
    uploadedBy: "Sistema",
    createdAt: "2026-07-01T12:00:00Z",
    waveform: generateWaveform(50),
    commentsCount: 3
  },
  {
    id: "track-2",
    title: "Maputo Night Shift",
    artist: "DJ Tarico",
    genre: "Amapiano",
    description: "A autêntica batida do Amapiano com as famosas 'log drums' que agitam todas as noites da capital Maputo.",
    audioUrl: "synth:amapiano_bass",
    coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=60",
    duration: 210,
    likesCount: 512,
    playCount: 3420,
    uploadedBy: "Sistema",
    createdAt: "2026-07-02T15:30:00Z",
    waveform: generateWaveform(50),
    commentsCount: 2
  },
  {
    id: "track-3",
    title: "Coração de Ouro",
    artist: "Cláudio Ismael",
    genre: "Kizomba",
    description: "Uma Kizomba romântica, suave e com aquela doçura vocal irresistível para dançar agarradinho.",
    audioUrl: "synth:kizomba_lead",
    coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=60",
    duration: 195,
    likesCount: 289,
    playCount: 1245,
    uploadedBy: "Sistema",
    createdAt: "2026-07-03T18:20:00Z",
    waveform: generateWaveform(50),
    commentsCount: 1
  },
  {
    id: "track-4",
    title: "Maza Maza (Gueto Beat)",
    artist: "DJ Maputo",
    genre: "Pandza",
    description: "Pandza puro e acelerado! Ritmo do gueto com muita batida, rimas e energia contagiante de Moçambique.",
    audioUrl: "synth:pandza_drums",
    coverUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=60",
    duration: 165,
    likesCount: 418,
    playCount: 2890,
    uploadedBy: "Sistema",
    createdAt: "2026-07-04T09:15:00Z",
    waveform: generateWaveform(50),
    commentsCount: 2
  },
  {
    id: "track-5",
    title: "Zavala Marimba",
    artist: "Timbila Sound System",
    genre: "Afro House",
    description: "Uma fusão incrível das vibrações tradicionais da Timbila de Zavala com batidas eletrónicas pesadas de Afro House.",
    audioUrl: "synth:afro_marimba",
    coverUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=60",
    duration: 240,
    likesCount: 610,
    playCount: 4560,
    uploadedBy: "Sistema",
    createdAt: "2026-07-05T14:45:00Z",
    waveform: generateWaveform(50),
    commentsCount: 4
  }
];

// In-memory comments
let comments = [
  {
    id: "c-1",
    trackId: "track-1",
    userId: "u-anon",
    username: "Dércio de Xai-Xai",
    userAvatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=dercio",
    text: "Essa guitarra de Marrabenta me faz lembrar de casa! Grande som, Mr. Bow!",
    timestamp: 45,
    createdAt: "2026-07-05T12:00:00Z"
  },
  {
    id: "c-2",
    trackId: "track-1",
    userId: "u-anon-2",
    username: "Gisela de Maputo",
    userAvatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=gisela",
    text: "Moçambique está on! Ritmo maravilhoso!",
    timestamp: 120,
    createdAt: "2026-07-05T15:00:00Z"
  },
  {
    id: "c-3",
    trackId: "track-1",
    userId: "u-anon-3",
    username: "Beto_Beira",
    userAvatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=beto",
    text: "Marrabenta clássica misturada com moderna, ficou maningue nice!",
    timestamp: 10,
    createdAt: "2026-07-06T08:00:00Z"
  },
  {
    id: "c-4",
    trackId: "track-2",
    userId: "u-anon-2",
    username: "Gisela de Maputo",
    userAvatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=gisela",
    text: "Essa log drum bate forte demais no peito!",
    timestamp: 62,
    createdAt: "2026-07-06T10:00:00Z"
  },
  {
    id: "c-5",
    trackId: "track-2",
    userId: "u-anon-3",
    username: "Beto_Beira",
    userAvatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=beto",
    text: "DJ Tarico nunca decepciona! Maputo está quente!",
    timestamp: 135,
    createdAt: "2026-07-06T11:30:00Z"
  }
];

// In-memory Playlists
let playlists = [
  {
    id: "play-1",
    name: "Hits do Verão Maputo",
    description: "As músicas mais quentes das noites de Moçambique. Sente a energia!",
    coverUrl: "https://images.unsplash.com/photo-1482440308425-276ad0f28b19?w=400&auto=format&fit=crop&q=60",
    trackIds: ["track-1", "track-2", "track-4"],
    createdBy: "DJ Moz",
    createdAt: "2026-07-04T12:00:00Z"
  },
  {
    id: "play-2",
    name: "Marrabenta e Tradição",
    description: "Sons tradicionais e novas fusões da nossa amada Marrabenta e ritmos folclóricos.",
    coverUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400&auto=format&fit=crop&q=60",
    trackIds: ["track-1", "track-3", "track-5"],
    createdBy: "Moz We On",
    createdAt: "2026-07-05T09:00:00Z"
  }
];

// ================= API ENDPOINTS =================

// 1. Get all tracks
app.get("/api/tracks", (req, res) => {
  res.json(tracks);
});

// 2. Upload a new track
app.post("/api/tracks", (req, res) => {
  const { title, artist, genre, description, audioUrl, coverUrl, duration } = req.body;

  if (!title || !artist || !genre) {
    return res.status(400).json({ error: "Título, artista e género são obrigatórios." });
  }

  const newTrack = {
    id: `track-${Date.now()}`,
    title,
    artist,
    genre: genre || "Outro",
    description: description || "Sem descrição disponível.",
    audioUrl: audioUrl || "synth:default",
    coverUrl: coverUrl || `https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=60`,
    duration: Number(duration) || 180,
    likesCount: 0,
    playCount: 0,
    uploadedBy: "Usuário",
    createdAt: new Date().toISOString(),
    waveform: generateWaveform(50),
    commentsCount: 0
  };

  tracks.unshift(newTrack);
  res.status(201).json(newTrack);
});

// 3. Play a track (increment playCount)
app.post("/api/tracks/:id/play", (req, res) => {
  const track = tracks.find(t => t.id === req.params.id);
  if (track) {
    track.playCount += 1;
    return res.json(track);
  }
  res.status(404).json({ error: "Faixa não encontrada." });
});

// 4. Like a track
app.post("/api/tracks/:id/like", (req, res) => {
  const track = tracks.find(t => t.id === req.params.id);
  if (track) {
    track.likesCount += 1;
    return res.json(track);
  }
  res.status(404).json({ error: "Faixa não encontrada." });
});

// 5. Get track comments
app.get("/api/tracks/:id/comments", (req, res) => {
  const trackComments = comments.filter(c => c.trackId === req.params.id);
  res.json(trackComments);
});

// 6. Post a comment
app.post("/api/tracks/:id/comments", (req, res) => {
  const { username, text, timestamp, userAvatar } = req.body;
  const track = tracks.find(t => t.id === req.params.id);

  if (!track) {
    return res.status(404).json({ error: "Faixa não encontrada." });
  }
  if (!text) {
    return res.status(400).json({ error: "O texto do comentário é obrigatório." });
  }

  const newComment = {
    id: `c-${Date.now()}`,
    trackId: req.params.id,
    userId: `u-${Date.now()}`,
    username: username || "Ouvinte Moz",
    userAvatar: userAvatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${username || 'ouvinte'}`,
    text,
    timestamp: Number(timestamp) || 0,
    createdAt: new Date().toISOString()
  };

  comments.push(newComment);
  track.commentsCount = comments.filter(c => c.trackId === track.id).length;

  res.status(201).json(newComment);
});

// 7. Get playlists
app.get("/api/playlists", (req, res) => {
  res.json(playlists);
});

// 8. Create a playlist
app.post("/api/playlists", (req, res) => {
  const { name, description, coverUrl, trackIds } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Nome da playlist é obrigatório." });
  }

  const newPlaylist = {
    id: `play-${Date.now()}`,
    name,
    description: description || "Sem descrição.",
    coverUrl: coverUrl || "https://images.unsplash.com/photo-1482440308425-276ad0f28b19?w=400&auto=format&fit=crop&q=60",
    trackIds: trackIds || [],
    createdBy: "Usuário",
    createdAt: new Date().toISOString()
  };

  playlists.push(newPlaylist);
  res.status(201).json(newPlaylist);
});

// 9. AI Music Curator ("DJ Moz")
app.post("/api/ai/curator", async (req, res) => {
  const { message, chatHistory } = req.body;

  if (!message) {
    return res.status(400).json({ error: "A mensagem do utilizador é obrigatória." });
  }

  const ai = getGeminiClient();

  // If Gemini is not configured, fall back to a beautiful rule-based local curator response!
  if (!ai) {
    const defaultReplies = [
      "Epa madié! Que vibração fantástica! Moz We On está on e quente! Para curtir uma boa Marrabenta, recomendo 'Keta Moçambique' do Mr. Bow. Queres que toque agora?",
      "Xé, madié! Estamos maningue on hoje! Se queres uma batida para abanar Maputo, tens de ouvir 'Maputo Night Shift' do DJ Tarico. É Amapiano puro!",
      "Boas, madié! Para relaxar com um par, a Kizomba de Cláudio Ismael, 'Coração de Ouro', é o txuna perfeito! Deixa rolar!",
      "Olá ouvinte! O Pandza de 'Maza Maza (Gueto Beat)' é pura energia do gueto de Maputo. Experimenta colocar na sua playlist!",
      "A nossa Timbila de Zavala misturada com Afro House em 'Zavala Marimba' é uma verdadeira viagem cultural! Deves escutar agora!"
    ];
    const randomReply = defaultReplies[Math.floor(Math.random() * defaultReplies.length)];

    // Look up some mock tracks to suggest
    const matchedTracks = tracks.slice(0, 2).map(t => t.id);

    return res.json({
      reply: randomReply + " *(Nota: O DJ Moz está rodando em modo offline porque a chave API do Gemini não foi configurada nos Segredos, mas o som não para!)*",
      suggestedTrackIds: matchedTracks
    });
  }

  try {
    // Format track summaries for Gemini context
    const tracksSummary = tracks.map(t => `- ID: "${t.id}", Título: "${t.title}", Artista: "${t.artist}", Género: "${t.genre}", Descrição: "${t.description}"`).join("\n");

    const systemInstruction = `Você é o 'DJ Moz', o curador de música oficial de Moçambique e anfitrião da plataforma 'Moz We On'.
Seu estilo é caloroso, brincalhão, acolhedor e profundamente apaixonado por música moçambicana.
Você fala de forma descontraída e amigável, usando gírias moçambicanas típicas de Maputo, Beira e outras partes de Moçambique.
Exemplos de gírias e termos moçambicanos que você usa de forma natural:
- "Madié" ou "Djei" (amigo, cara, mano)
- "Maningue" (muito, imenso)
- "Nice" (legal, bom) -> "maningue nice" (muito legal)
- "Txuna" (ajustar, organizar, arrumar, caprichar) -> "vamos txunar esse som"
- "Xé!" (expressão de espanto ou atenção, tipo "Ei!")
- "Estamos on" (estamos ativos, prontos, sintonizados)
- "Keta" (dançar Marrabenta ou curtir)
- "Chapa" (transporte público local, usado para metáforas de viagem)
- "Xigubo" (dança tradicional guerreira)

Seu objetivo é guiar o usuário na nossa biblioteca de música. Aqui estão as músicas disponíveis ATUALMENTE na nossa plataforma "Moz We On":
${tracksSummary}

Quando o usuário pedir recomendações ou falar de humor, sugira uma ou mais destas faixas usando seus IDs correspondentes.
Você DEVE responder rigorosamente no formato JSON com as propriedades 'reply' (sua fala personalizada de DJ) e 'suggestedTrackIds' (uma lista de IDs de faixas correspondentes às suas sugestões).`;

    // Format chat history for Gemini API
    const contents = [];
    if (chatHistory && Array.isArray(chatHistory)) {
      chatHistory.forEach((msg: any) => {
        contents.push({
          role: msg.sender === "user" ? "user" : "model",
          parts: [{ text: msg.text }]
        });
      });
    }
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description: "A resposta textual do DJ Moz, cheia de gírias e entusiasmo moçambicano."
            },
            suggestedTrackIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array de IDs das faixas recomendadas pelo DJ que estão listadas na plataforma."
            }
          },
          required: ["reply", "suggestedTrackIds"]
        }
      }
    });

    const resultText = response.text || "{}";
    const resultJson = JSON.parse(resultText.trim());
    res.json(resultJson);

  } catch (error) {
    console.error("Erro no DJ Moz AI:", error);
    res.status(500).json({
      error: "Ocorreu um erro no processador do DJ Moz.",
      reply: "Epa madié! Ocorreu um curto-circuito na mesa de mistura do DJ! Mas a festa continua, tenta falar comigo novamente!",
      suggestedTrackIds: []
    });
  }
});


// ================= VITE OR STATIC ASSETS MIDDLEWARE =================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Moz We On Server] Server running on http://localhost:${PORT}`);
  });
}

startServer();
