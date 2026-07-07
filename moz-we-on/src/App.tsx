import React, { useState, useEffect } from "react";
import { Compass, Music, Flame, Search, Heart, Sparkles, Plus, ListMusic, Headset, Library, Wifi, WifiOff } from "lucide-react";
import Sidebar from "./components/Sidebar";
import AICurator from "./components/AICurator";
import TrackCard from "./components/TrackCard";
import UploadModal from "./components/UploadModal";
import AudioPlayer from "./components/AudioPlayer";
import TrackDetails from "./components/TrackDetails";
import GenreStats from "./components/GenreStats";
import { Track, Playlist, ChatMessage, PlayHistoryItem } from "./types";
import {
  cacheTrackOffline,
  removeTrackFromOfflineCache,
  getAllOfflineCachedTracks,
  isTrackOfflineCached
} from "./lib/offlineCache";

export default function App() {
  // Navigation & Screen States
  const [currentTab, setCurrentTab] = useState("explore");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [selectedGenre, setSelectedGenre] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");

  // Player & Detail Drawer States
  const [currentPlayingTrack, setCurrentPlayingTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Offline and caching state
  const [isOffline, setIsOffline] = useState(false);
  const [cachedTrackIds, setCachedTrackIds] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  const syncCachedTracks = async () => {
    try {
      const cached = await getAllOfflineCachedTracks();
      setCachedTrackIds(new Set(cached.map((t) => t.id)));
    } catch (e) {
      console.error("Failed to sync cached tracks:", e);
    }
  };

  // Persistence States (Local likes/uploads tracking)
  const [likedTrackIds, setLikedTrackIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("moz_we_on_likes");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [uploadedTrackIds, setUploadedTrackIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("moz_we_on_uploads");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const [playHistory, setPlayHistory] = useState<PlayHistoryItem[]>(() => {
    const saved = localStorage.getItem("moz_we_on_play_history");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse play history:", e);
      }
    }
    // Seed some initial data so the chart isn't empty and looks stunning right away
    const seed: PlayHistoryItem[] = [
      { id: "seed1", trackId: "track-1", title: "Keta Moçambique", artist: "Mr. Bow", genre: "Marrabenta", timestamp: Date.now() - 3600000 * 24 },
      { id: "seed2", trackId: "track-1", title: "Keta Moçambique", artist: "Mr. Bow", genre: "Marrabenta", timestamp: Date.now() - 3600000 * 20 },
      { id: "seed3", trackId: "track-2", title: "Maputo Night Shift", artist: "DJ Tarico", genre: "Amapiano", timestamp: Date.now() - 3600000 * 18 },
      { id: "seed4", trackId: "track-2", title: "Maputo Night Shift", artist: "DJ Tarico", genre: "Amapiano", timestamp: Date.now() - 3600000 * 15 },
      { id: "seed5", trackId: "track-2", title: "Maputo Night Shift", artist: "DJ Tarico", genre: "Amapiano", timestamp: Date.now() - 3600000 * 12 },
      { id: "seed6", trackId: "track-4", title: "Maza Maza (Gueto Beat)", artist: "DJ Maputo", genre: "Pandza", timestamp: Date.now() - 3600000 * 8 },
      { id: "seed7", trackId: "track-3", title: "Coração de Ouro", artist: "Cláudio Ismael", genre: "Kizomba", timestamp: Date.now() - 3600000 * 4 },
      { id: "seed8", trackId: "track-5", title: "Zavala Marimba", artist: "Timbila Sound System", genre: "Afro House", timestamp: Date.now() - 3600000 * 2 }
    ];
    return seed;
  });

  // AI Loading state
  const [djIsGenerating, setDjIsGenerating] = useState(false);

  // New Playlist creation popover state
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDesc, setNewPlaylistDesc] = useState("");
  const [showPlaylistCreate, setShowPlaylistCreate] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);

  // Fetch initial data
  const loadData = async (forceOffline = false) => {
    if (isOffline || forceOffline) {
      try {
        const cached = await getAllOfflineCachedTracks();
        setTracks(cached);
      } catch (err) {
        console.error("Failed to load cached tracks:", err);
      }
      return;
    }

    try {
      const tracksRes = await fetch("/api/tracks");
      if (tracksRes.ok) {
        const tracksData = await tracksRes.json();
        setTracks(tracksData);
      } else {
        const cached = await getAllOfflineCachedTracks();
        setTracks(cached);
      }

      const playlistsRes = await fetch("/api/playlists");
      if (playlistsRes.ok) {
        const playlistsData = await playlistsRes.json();
        setPlaylists(playlistsData);
      }
    } catch (e) {
      console.error("Error loading tracks or playlists, trying offline cache fallback:", e);
      const cached = await getAllOfflineCachedTracks();
      setTracks(cached);
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      showToast("Conexão restabelecida! A voltar para o modo online.");
    };
    const handleOffline = () => {
      setIsOffline(true);
      showToast("Ficaste sem rede! Entraste no Modo Offline automaticamente.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsOffline(true);
    }

    // Sync initial cache
    syncCachedTracks();

    // Load initial DJ Moz chat greeting
    const greeting: ChatMessage = {
      id: "greeting",
      sender: "dj",
      text: "Xé! Estamos maningue on, madié! 🎧\n\nEu sou o DJ Moz, o teu curador oficial aqui no Moz We On. Estou aqui para te txunar os ritmos mais quentes da nossa terra. Queres curtir uma boa Marrabenta tradicional, abanar a cabeça com Amapiano de Maputo, bater o pé com Pandza acelerado ou dançar uma Kizomba suave?\n\nDiz-me o teu humor ou faz um teste rápido com os botões abaixo. Vamos dar o play!",
      timestamp: new Date().toLocaleTimeString("pt-MZ", { hour: "2-digit", minute: "2-digit" })
    };
    setChatHistory([greeting]);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    loadData();
  }, [isOffline]);

  // Save likes and uploads to local storage on change
  useEffect(() => {
    localStorage.setItem("moz_we_on_likes", JSON.stringify(Array.from(likedTrackIds)));
  }, [likedTrackIds]);

  useEffect(() => {
    localStorage.setItem("moz_we_on_uploads", JSON.stringify(Array.from(uploadedTrackIds)));
  }, [uploadedTrackIds]);

  useEffect(() => {
    localStorage.setItem("moz_we_on_play_history", JSON.stringify(playHistory));
  }, [playHistory]);

  // Handle Play Event
  const handlePlayTrack = async (track: Track) => {
    // Increment playcount on backend
    try {
      await fetch(`/api/tracks/${track.id}/play`, { method: "POST" });
    } catch (e) {
      console.error(e);
    }

    setCurrentPlayingTrack(track);
    setIsPlaying(true);

    // Update playcount locally immediately to keep UI snappy
    setTracks((prev) =>
      prev.map((t) => (t.id === track.id ? { ...t, playCount: t.playCount + 1 } : t))
    );

    // Add to play history
    const newPlay: PlayHistoryItem = {
      id: `play-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      trackId: track.id,
      title: track.title,
      artist: track.artist,
      genre: track.genre,
      timestamp: Date.now()
    };
    setPlayHistory((prev) => [...prev, newPlay]);
  };

  const handleClearHistory = () => {
    setPlayHistory([]);
    showToast("Histórico de reprodução local limpo!");
  };

  // Skip Forward
  const handleNextTrack = () => {
    if (tracks.length === 0 || !currentPlayingTrack) return;
    const currentIndex = tracks.findIndex((t) => t.id === currentPlayingTrack.id);
    const nextIndex = (currentIndex + 1) % tracks.length;
    handlePlayTrack(tracks[nextIndex]);
  };

  // Skip Backward
  const handlePrevTrack = () => {
    if (tracks.length === 0 || !currentPlayingTrack) return;
    const currentIndex = tracks.findIndex((t) => t.id === currentPlayingTrack.id);
    const prevIndex = currentIndex === 0 ? tracks.length - 1 : currentIndex - 1;
    handlePlayTrack(tracks[prevIndex]);
  };

  // Handle Like/Unlike Track (with automatic offline Cache API storage)
  const handleLikeTrack = async (trackId: string) => {
    const isLiked = likedTrackIds.has(trackId);
    const updated = new Set(likedTrackIds);
    const track = tracks.find((t) => t.id === trackId);

    if (isLiked) {
      updated.delete(trackId);
      setLikedTrackIds(updated);
      setTracks((prev) =>
        prev.map((t) => (t.id === trackId ? { ...t, likesCount: Math.max(0, t.likesCount - 1) } : t))
      );

      // Remove from browser Cache API
      if (track) {
        await removeTrackFromOfflineCache(trackId, track.coverUrl);
        showToast(`Música "${track.title}" removida do cache offline.`);
        await syncCachedTracks();
      }
    } else {
      updated.add(trackId);
      setLikedTrackIds(updated);
      // Increment on backend
      if (!isOffline) {
        try {
          await fetch(`/api/tracks/${trackId}/like`, { method: "POST" });
        } catch (e) {
          console.error(e);
        }
      }
      setTracks((prev) =>
        prev.map((t) => (t.id === trackId ? { ...t, likesCount: t.likesCount + 1 } : t))
      );

      // Store in browser Cache API
      if (track) {
        showToast(`A guardar "${track.title}" no cache offline...`);
        const success = await cacheTrackOffline(track);
        if (success) {
          showToast(`"${track.title}" guardada para ouvir offline! 🎧`);
        }
        await syncCachedTracks();
      }
    }
  };

  // Explicit Cache Toggle for User Flexibility
  const handleToggleOfflineCache = async (track: Track, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isCurrentlyCached = cachedTrackIds.has(track.id);

    if (isCurrentlyCached) {
      showToast(`A remover "${track.title}" do cache...`);
      const success = await removeTrackFromOfflineCache(track.id, track.coverUrl);
      if (success) {
        showToast(`Removida com sucesso do cache.`);
      }
    } else {
      showToast(`A descarregar "${track.title}" para o cache...`);
      const success = await cacheTrackOffline(track);
      if (success) {
        showToast(`"${track.title}" está disponível offline! 💾`);
      }
    }
    await syncCachedTracks();
  };

  // Handle Send Message to DJ Moz AI
  const handleSendMessageToDJ = async (messageText: string) => {
    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: messageText,
      timestamp: new Date().toLocaleTimeString("pt-MZ", { hour: "2-digit", minute: "2-digit" })
    };

    const updatedHistory = [...chatHistory, userMessage];
    setChatHistory(updatedHistory);
    setDjIsGenerating(true);

    try {
      const response = await fetch("/api/ai/curator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: messageText,
          chatHistory: updatedHistory.slice(-6) // Only pass recent history to keep it fast
        })
      });

      if (!response.ok) {
        throw new Error("DJ Moz teve um problema de conexão.");
      }

      const data = await response.json();

      const djResponse: ChatMessage = {
        id: `dj-${Date.now()}`,
        sender: "dj",
        text: data.reply,
        timestamp: new Date().toLocaleTimeString("pt-MZ", { hour: "2-digit", minute: "2-digit" }),
        suggestedTracks: data.suggestedTrackIds || []
      };

      setChatHistory((prev) => [...prev, djResponse]);
    } catch (error: any) {
      console.error(error);
      const djErrorResponse: ChatMessage = {
        id: `dj-err-${Date.now()}`,
        sender: "dj",
        text: "Epa madié! Deu um curto-circuito na minha mesa de mistura! Mas o ritmo não para, pergunta-me outra vez ou escolhe uma batida no painel!",
        timestamp: new Date().toLocaleTimeString("pt-MZ", { hour: "2-digit", minute: "2-digit" })
      };
      setChatHistory((prev) => [...prev, djErrorResponse]);
    } finally {
      setDjIsGenerating(false);
    }
  };

  // Handle Playlist creation
  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    try {
      const response = await fetch("/api/playlists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: newPlaylistName,
          description: newPlaylistDesc || "Playlist customizada criada no Moz We On."
        })
      });

      if (response.ok) {
        const newPlay = await response.json();
        setPlaylists((prev) => [...prev, newPlay]);
        setNewPlaylistName("");
        setNewPlaylistDesc("");
        setShowPlaylistCreate(false);
      }
    } catch (e) {
      console.error("Error creating playlist:", e);
    }
  };

  // Add currently selected track to playlist
  const handleAddTrackToPlaylist = async (playlistId: string, trackId: string) => {
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist || playlist.trackIds.includes(trackId)) return;

    const updatedTrackIds = [...playlist.trackIds, trackId];

    // Simple update state locally
    setPlaylists((prev) =>
      prev.map((p) => (p.id === playlistId ? { ...p, trackIds: updatedTrackIds } : p))
    );
  };

  // Filtered tracks list
  const filteredTracks = tracks.filter((track) => {
    const matchesGenre = selectedGenre === "Todos" || track.genre === selectedGenre;
    const matchesSearch =
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.genre.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGenre && matchesSearch;
  });

  return (
    <div id="moz-we-on-root" className="flex h-screen bg-zinc-950 font-sans text-zinc-100 overflow-hidden select-none">
      {/* 1. Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          setSelectedPlaylist(null); // Clear selected playlist when moving away
        }}
        openUploadModal={() => setUploadModalOpen(true)}
        likesCount={likedTrackIds.size}
        playlistCount={playlists.length}
      />

      {/* 2. Main Content Board */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-b from-zinc-900 to-zinc-950">
        {/* Top Navbar */}
        <header className="h-16 border-b border-zinc-900 px-8 flex items-center justify-between gap-6 bg-zinc-950/40 shrink-0">
          <div className="flex-1 max-w-md relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar faixas, cantores, batidas moçambicanas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 hover:bg-zinc-900/80 focus:bg-zinc-900 border border-zinc-800/80 focus:border-amber-500 rounded-full py-2 pl-10 pr-4 text-xs outline-none transition-all text-zinc-100 placeholder-zinc-500"
            />
          </div>

          <div className="flex items-center gap-3.5 text-xs text-zinc-400">
            {/* Offline Simulation Switch */}
            <button
              onClick={() => {
                const newOfflineState = !isOffline;
                setIsOffline(newOfflineState);
                showToast(newOfflineState ? "Modo Offline Activo! A sintonizar do Cache do Navegador." : "Modo Online Activo! A ligar ao servidor.");
              }}
              className={`flex items-center gap-1.5 font-mono text-[10px] py-1.5 px-3 rounded-full border transition-all cursor-pointer ${
                isOffline
                  ? "bg-amber-500/10 text-amber-500 border-amber-500/40 hover:bg-amber-500/20"
                  : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-300"
              }`}
              title="Simular Modo Offline (Teste da API Cache)"
            >
              {isOffline ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-500" />
                  <span>Modo Offline</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Modo Online</span>
                </>
              )}
            </button>

            <span className="flex items-center gap-1.5 font-mono text-[10px] bg-zinc-900 py-1.5 px-3 rounded-full border border-zinc-800">
              <span className={`w-2 h-2 rounded-full ${isOffline ? "bg-amber-500" : "bg-emerald-500"} animate-pulse`}></span>
              {isOffline ? "A Ouvir do Cache" : "Moçambique está On"}
            </span>
            <img
              src="https://api.dicebear.com/7.x/adventurer/svg?seed=antony"
              alt="User profile avatar"
              className="w-8 h-8 rounded-full border border-zinc-800"
            />
          </div>
        </header>

        {/* Dynamic View Scrollport */}
        <div className="flex-1 overflow-y-auto p-8 pb-32">
          {selectedPlaylist ? (
            /* Playlist Detail view */
            <div className="space-y-6">
              <button
                onClick={() => setSelectedPlaylist(null)}
                className="text-xs text-amber-500 hover:text-amber-400 cursor-pointer font-bold"
              >
                &larr; Voltar para as Playlists
              </button>

              <div className="flex flex-col md:flex-row gap-6 items-end">
                <img
                  src={selectedPlaylist.coverUrl}
                  alt={selectedPlaylist.name}
                  className="w-40 h-40 rounded-2xl object-cover shadow-xl border border-zinc-800"
                />
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded-full uppercase">
                    Playlist Colectiva
                  </span>
                  <h2 className="font-display font-black text-3xl tracking-tight text-white">{selectedPlaylist.name}</h2>
                  <p className="text-sm text-zinc-400 font-sans">{selectedPlaylist.description}</p>
                  <p className="text-xs text-zinc-500 font-mono pt-2">
                    Criada por {selectedPlaylist.createdBy} • {selectedPlaylist.trackIds.length} faixas sintonizadas
                  </p>
                </div>
              </div>

              {/* Tracks in playlist */}
              <div className="pt-6 space-y-2.5">
                <h3 className="font-display font-bold text-lg text-zinc-300">Faixas na Playlist</h3>
                {selectedPlaylist.trackIds.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-6">Nenhuma música adicionada ainda. Sintoniza mais sons!</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {selectedPlaylist.trackIds.map((tid) => {
                      const track = tracks.find((t) => t.id === tid);
                      if (!track) return null;
                      return (
                        <TrackCard
                          key={track.id}
                          track={track}
                          onPlay={handlePlayTrack}
                          isPlaying={currentPlayingTrack?.id === track.id && isPlaying}
                          onLike={handleLikeTrack}
                          hasLiked={likedTrackIds.has(track.id)}
                          onSelectTrack={setSelectedTrack}
                          isOfflineCached={cachedTrackIds.has(track.id)}
                          onToggleOfflineCache={handleToggleOfflineCache}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : currentTab === "explore" ? (
            /* Explore Tab Screen */
            <div className="space-y-8 animate-fadeIn">
              {/* Grand Banner */}
              <div className="relative h-56 rounded-3xl overflow-hidden bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 shadow-xl border border-amber-500/20 flex flex-col justify-between p-8">
                {/* Visual grid overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px]"></div>

                <div className="relative z-10 max-w-lg space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase bg-white/20 text-white tracking-widest px-3 py-1 rounded-full w-fit">
                    Estilo SoundCloud Moçambique
                  </span>
                  <h2 className="font-display font-black text-2xl md:text-3xl tracking-tight text-white leading-tight">
                    SENTE O RITMO DE MOÇAMBIQUE, MADIÉ!
                  </h2>
                  <p className="text-xs md:text-sm text-zinc-100 font-sans leading-relaxed">
                    A primeira plataforma dedicada a conectar e amplificar os sons mais quentes de Maputo à Beira, do tradicional ao electrónico!
                  </p>
                </div>

                <div className="relative z-10 flex items-center gap-3">
                  <button
                    onClick={() => handleSendMessageToDJ("Qual é a melhor Marrabenta que tens?")}
                    className="py-2.5 px-4 rounded-xl bg-zinc-950/80 hover:bg-zinc-950 text-amber-500 hover:text-amber-400 font-bold text-xs flex items-center gap-2 border border-zinc-800/40 shadow transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Falar com DJ Moz AI</span>
                  </button>
                  <button
                    onClick={() => setUploadModalOpen(true)}
                    className="py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs shadow transition-all cursor-pointer"
                  >
                    Lançar Nova Faixa
                  </button>
                </div>
              </div>

              {/* Genre Selector Filter Rails */}
              <div className="space-y-3">
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Filtrar por Género</p>
                <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin">
                  {["Todos", "Marrabenta", "Pandza", "Amapiano", "Kizomba", "Afro House"].map((genre) => (
                    <button
                      key={genre}
                      onClick={() => setSelectedGenre(genre)}
                      className={`px-4.5 py-2 rounded-full text-xs font-semibold cursor-pointer whitespace-nowrap transition-all border ${
                        selectedGenre === genre
                          ? "bg-amber-500 text-zinc-950 border-amber-500 shadow-md font-bold"
                          : "bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800/80 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tracks Display Section */}
              <div className="space-y-4">
                <h3 className="font-display font-black text-xl tracking-tight text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-500 animate-pulse" />
                  <span>Sons em Destaque</span>
                </h3>

                {filteredTracks.length === 0 ? (
                  <div className="text-center py-16 bg-zinc-900/20 border border-zinc-900/50 rounded-2xl">
                    <p className="text-sm text-zinc-500">Nenhum som sintonizado nesta secção.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredTracks.map((track) => (
                      <TrackCard
                        key={track.id}
                        track={track}
                        onPlay={handlePlayTrack}
                        isPlaying={currentPlayingTrack?.id === track.id && isPlaying}
                        onLike={handleLikeTrack}
                        hasLiked={likedTrackIds.has(track.id)}
                        onSelectTrack={setSelectedTrack}
                        isOfflineCached={cachedTrackIds.has(track.id)}
                        onToggleOfflineCache={handleToggleOfflineCache}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : currentTab === "library" ? (
            /* Library Tab Screen */
            <div className="space-y-8 animate-fadeIn">
              <div className="border-b border-zinc-900 pb-4">
                <h2 className="font-display font-black text-2xl tracking-tight text-white flex items-center gap-2">
                  <Library className="w-6 h-6 text-amber-500" /> Biblioteca de Sons
                </h2>
                <p className="text-xs text-zinc-400 mt-1">Gere as tuas preferências de streaming locais</p>
              </div>

              {/* Rhythm and Genre Stats */}
              <GenreStats playHistory={playHistory} onClearHistory={handleClearHistory} />

              {/* Likes Group Grid */}
              <div className="space-y-4">
                <h3 className="font-display font-bold text-lg text-zinc-200 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500 fill-current" /> Sons Favoritos ({likedTrackIds.size})
                </h3>
                {likedTrackIds.size === 0 ? (
                  <div className="text-center py-12 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-2xl">
                    <p className="text-xs text-zinc-500">Ainda não gostaste de nenhuma música. Clica no coração nos sons que curtires!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {tracks
                      .filter((t) => likedTrackIds.has(t.id))
                      .map((track) => (
                        <TrackCard
                          key={track.id}
                          track={track}
                          onPlay={handlePlayTrack}
                          isPlaying={currentPlayingTrack?.id === track.id && isPlaying}
                          onLike={handleLikeTrack}
                          hasLiked={true}
                          onSelectTrack={setSelectedTrack}
                          isOfflineCached={cachedTrackIds.has(track.id)}
                          onToggleOfflineCache={handleToggleOfflineCache}
                        />
                      ))}
                  </div>
                )}
              </div>

              {/* User Uploads Grid */}
              <div className="space-y-4 pt-4">
                <h3 className="font-display font-bold text-lg text-zinc-200 flex items-center gap-2">
                  <Music className="w-5 h-5 text-amber-500" /> Meus Lançamentos ({uploadedTrackIds.size})
                </h3>
                {uploadedTrackIds.size === 0 ? (
                  <div className="text-center py-12 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-3">
                    <p className="text-xs text-zinc-500">Não lançaste nenhum som ainda, madié!</p>
                    <button
                      onClick={() => setUploadModalOpen(true)}
                      className="text-xs font-bold text-zinc-950 bg-amber-500 hover:bg-amber-400 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer"
                    >
                      Lançar Primeira Música
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {tracks
                      .filter((t) => uploadedTrackIds.has(t.id))
                      .map((track) => (
                        <TrackCard
                          key={track.id}
                          track={track}
                          onPlay={handlePlayTrack}
                          isPlaying={currentPlayingTrack?.id === track.id && isPlaying}
                          onLike={handleLikeTrack}
                          hasLiked={likedTrackIds.has(track.id)}
                          onSelectTrack={setSelectedTrack}
                          isOfflineCached={cachedTrackIds.has(track.id)}
                          onToggleOfflineCache={handleToggleOfflineCache}
                        />
                      ))}
                  </div>
                )}
              </div>
            </div>
          ) : currentTab === "playlists" ? (
            /* Playlists Tab Screen */
            <div className="space-y-8 animate-fadeIn">
              <div className="border-b border-zinc-900 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-display font-black text-2xl tracking-tight text-white flex items-center gap-2">
                    <ListMusic className="w-6 h-6 text-amber-500" /> Listas de Reprodução (Playlists)
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">Agrupa e organiza os teus sons favoritos de Moçambique</p>
                </div>
                <button
                  onClick={() => setShowPlaylistCreate(!showPlaylistCreate)}
                  className="py-2 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-amber-500 hover:text-amber-400 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Criar Playlist
                </button>
              </div>

              {/* Inline Playlist creation form */}
              {showPlaylistCreate && (
                <form onSubmit={handleCreatePlaylist} className="p-5 bg-zinc-900/50 border border-zinc-800 rounded-2xl max-w-md space-y-3.5 animate-fadeIn">
                  <h4 className="font-bold text-sm text-zinc-100">Nova Playlist</h4>
                  <div className="space-y-2">
                    <input
                      type="text"
                      required
                      placeholder="Nome da Playlist..."
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs outline-none transition-all text-zinc-100 placeholder-zinc-600"
                    />
                    <input
                      type="text"
                      placeholder="Breve descrição da vibração..."
                      value={newPlaylistDesc}
                      onChange={(e) => setNewPlaylistDesc(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs outline-none transition-all text-zinc-100 placeholder-zinc-600"
                    />
                  </div>
                  <div className="flex justify-end gap-2 text-xs font-bold pt-1">
                    <button
                      type="button"
                      onClick={() => setShowPlaylistCreate(false)}
                      className="py-1.5 px-3 rounded-lg bg-zinc-900 text-zinc-400"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="py-1.5 px-4.5 rounded-lg bg-amber-500 text-zinc-950 hover:bg-amber-400 transition-all"
                    >
                      Criar
                    </button>
                  </div>
                </form>
              )}

              {/* Playlists grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {playlists.map((playlist) => (
                  <div
                    key={playlist.id}
                    onClick={() => setSelectedPlaylist(playlist)}
                    className="p-4 bg-zinc-900/40 border border-zinc-900/60 hover:bg-zinc-900 hover:border-zinc-800/80 rounded-2xl flex items-center gap-4 cursor-pointer transition-all duration-200 group"
                  >
                    <img
                      src={playlist.coverUrl}
                      alt={playlist.name}
                      className="w-16 h-16 rounded-xl object-cover shadow-md shrink-0"
                    />
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <h4 className="font-display font-bold text-sm text-zinc-100 group-hover:text-amber-400 transition-colors truncate">
                        {playlist.name}
                      </h4>
                      <p className="text-xs text-zinc-500 truncate">{playlist.description}</p>
                      <p className="text-[10px] font-mono text-amber-500">{playlist.trackIds.length} faixas</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : currentTab === "dj-ai" ? (
            /* AI DJ Curator tab screen */
            <div className="h-full max-h-[calc(100vh-140px)] rounded-3xl overflow-hidden border border-zinc-900 shadow-xl bg-zinc-950">
              <AICurator
                chatHistory={chatHistory}
                onSendMessage={handleSendMessageToDJ}
                isGenerating={djIsGenerating}
                tracks={tracks}
                onPlayTrack={handlePlayTrack}
                currentPlayingTrack={currentPlayingTrack}
              />
            </div>
          ) : null}
        </div>
      </main>

      {/* 3. Sliding Track Details Drawer Panel */}
      {selectedTrack && (
        <TrackDetails
          track={selectedTrack}
          isPlaying={isPlaying}
          onPlay={handlePlayTrack}
          onClose={() => setSelectedTrack(null)}
          onLike={handleLikeTrack}
          hasLiked={likedTrackIds.has(selectedTrack.id)}
          currentPlayingTrack={currentPlayingTrack}
        />
      )}

      {/* 4. Global Music Player Control Deck (Bottom bar) */}
      <AudioPlayer
        currentTrack={currentPlayingTrack}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        onNext={handleNextTrack}
        onPrev={handlePrevTrack}
      />

      {/* 5. Upload New Track Dialogue */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadSuccess={(newTrack) => {
          setTracks((prev) => [newTrack, ...prev]);
          const updatedUploads = new Set(uploadedTrackIds);
          updatedUploads.add(newTrack.id);
          setUploadedTrackIds(updatedUploads);
        }}
      />

      {/* 6. Offline status/cache feedback toast */}
      {toastMessage && (
        <div id="offline-toast" className="fixed bottom-24 right-6 bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs px-4 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-2.5 animate-slideLeft">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
