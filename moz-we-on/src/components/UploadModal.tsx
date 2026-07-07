import React, { useState } from "react";
import { X, Upload, Music, Image as ImageIcon, Sparkles, AlertCircle } from "lucide-react";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (newTrack: any) => void;
}

export default function UploadModal({
  isOpen,
  onClose,
  onUploadSuccess
}: UploadModalProps) {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [genre, setGenre] = useState("Marrabenta");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [audioPreset, setAudioPreset] = useState("marrabenta_guitar");
  const [useAIBeat, setUseAIBeat] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // New import features states
  const [activeTab, setActiveTab] = useState<"synthesize" | "import">("synthesize");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioFileName, setAudioFileName] = useState("");
  const [duration, setDuration] = useState(180);
  const [dragActive, setDragActive] = useState(false);

  if (!isOpen) return null;

  const genres = [
    { value: "Marrabenta", label: "Marrabenta" },
    { value: "Pandza", label: "Pandza" },
    { value: "Amapiano", label: "Amapiano" },
    { value: "Kizomba", label: "Kizomba" },
    { value: "Afro House", label: "Afro House" },
    { value: "Outro", label: "Outro" }
  ];

  const presets = [
    { value: "marrabenta_guitar", label: "Guitarrada Marrabenta" },
    { value: "amapiano_bass", label: "Log Drum Amapiano" },
    { value: "kizomba_lead", label: "Kizomba Romântico" },
    { value: "pandza_drums", label: "Pandza Ritmo Rápido" },
    { value: "afro_marimba", label: "Marimba de Zavala (Afro House)" }
  ];

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processAudioFile(file);
  };

  const processAudioFile = (file: File) => {
    setAudioFile(file);
    setAudioFileName(file.name);

    // Auto-fill Title from filename if empty or not touched
    const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
    if (!title) {
      setTitle(cleanName);
    }

    try {
      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      audio.onloadedmetadata = () => {
        setDuration(Math.round(audio.duration) || 180);
        URL.revokeObjectURL(audio.src);
      };
    } catch (err) {
      console.error("Error reading audio duration:", err);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("audio/")) {
      processAudioFile(file);
    } else {
      setError("Por favor, arraste um ficheiro de áudio válido.");
    }
  };

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleCoverUploadMock = () => {
    const randomCovers = [
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1482440308425-276ad0f28b19?w=500&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=500&auto=format&fit=crop&q=80"
    ];
    const chosen = randomCovers[Math.floor(Math.random() * randomCovers.length)];
    setCoverUrl(chosen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim() || !artist.trim()) {
      setError("Por favor preencha o Título e o Nome do Artista.");
      return;
    }

    if (activeTab === "import" && !audioFile) {
      setError("Por favor seleccione ou arraste um ficheiro de áudio para importar.");
      return;
    }

    setIsSubmitting(true);

    const defaultCovers = [
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=60"
    ];

    let finalAudioUrl = "synth:default";
    if (activeTab === "import" && audioFile) {
      try {
        finalAudioUrl = await readFileAsDataURL(audioFile);
      } catch (err) {
        setError("Erro ao processar o ficheiro de áudio seleccionado.");
        setIsSubmitting(false);
        return;
      }
    } else {
      finalAudioUrl = useAIBeat ? `synth:${audioPreset}` : "synth:default";
    }

    const payload = {
      title,
      artist,
      genre,
      description: description || `Uma nova batida de ${genre} lançada no Moz We On por ${artist}.`,
      coverUrl: coverUrl || defaultCovers[Math.floor(Math.random() * defaultCovers.length)],
      audioUrl: finalAudioUrl,
      duration: duration
    };

    try {
      const response = await fetch("/api/tracks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Falha ao registar a música no servidor.");
      }

      const newTrack = await response.json();
      onUploadSuccess(newTrack);
      onClose();

      // Clear states
      setTitle("");
      setArtist("");
      setGenre("Marrabenta");
      setDescription("");
      setCoverUrl("");
      setAudioPreset("marrabenta_guitar");
      setUseAIBeat(true);
      setAudioFile(null);
      setAudioFileName("");
      setDuration(180);
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro no upload.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="upload-modal-overlay" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-900 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scaleUp">
        {/* Header */}
        <div className="p-6 border-b border-zinc-900 flex items-center justify-between bg-zinc-900/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-zinc-100">Lançar ou Importar Som</h3>
              <p className="text-xs text-zinc-400">Publique os seus próprios ficheiros de áudio ou crie novas batidas IA</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-zinc-950 border-b border-zinc-900">
          <button
            type="button"
            onClick={() => setActiveTab("synthesize")}
            className={`flex-1 py-3 text-xs font-mono font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer text-center ${
              activeTab === "synthesize"
                ? "border-amber-500 text-amber-500 bg-zinc-900/10"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            ✨ Sintetizar Nova Batida
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("import")}
            className={`flex-1 py-3 text-xs font-mono font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer text-center ${
              activeTab === "import"
                ? "border-amber-500 text-amber-500 bg-zinc-900/10"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            📥 Importar Ficheiro Local
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[calc(100vh-250px)] overflow-y-auto">
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs rounded-xl flex items-center gap-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left Col: Metadata */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Título da Música</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Noites de Maputo"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl py-3 px-4 text-sm text-zinc-100 outline-none transition-all placeholder-zinc-600"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Nome do Artista</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: MC Shabba"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl py-3 px-4 text-sm text-zinc-100 outline-none transition-all placeholder-zinc-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className={activeTab === "import" ? "col-span-2" : ""}>
                  <label className="block text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Género Rítmico</label>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl py-3 px-3 text-sm text-zinc-100 outline-none transition-all cursor-pointer"
                  >
                    {genres.map((g) => (
                      <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                  </select>
                </div>

                {activeTab === "synthesize" && (
                  <div>
                    <label className="block text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Áudio</label>
                    <select
                      disabled={!useAIBeat}
                      value={audioPreset}
                      onChange={(e) => setAudioPreset(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl py-3 px-3 text-sm text-zinc-100 outline-none transition-all cursor-pointer disabled:opacity-50"
                    >
                      {presets.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Descrição / Letras</label>
                <textarea
                  rows={3}
                  placeholder="Escreve uma curta história sobre a batida ou trechos da letra..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl py-3 px-4 text-sm text-zinc-100 outline-none transition-all placeholder-zinc-600 resize-none"
                />
              </div>
            </div>

            {/* Right Col: Audio & Visual Artwork */}
            <div className="space-y-4 flex flex-col justify-between">
              {/* Cover Artwork Box */}
              <div>
                <label className="block text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Capa da Faixa (Artwork)</label>
                <div className="border border-dashed border-zinc-800 hover:border-amber-500/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all bg-zinc-900/20 group relative overflow-hidden h-44">
                  {coverUrl ? (
                    <>
                      <img src={coverUrl} alt="Cover Preview" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={handleCoverUploadMock}
                          className="px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs transition-all cursor-pointer hover:bg-amber-400"
                        >
                          Trocar Capa
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <ImageIcon className="w-10 h-10 text-zinc-600 group-hover:text-amber-500 transition-colors mb-2.5" />
                      <p className="text-xs text-zinc-400">Nenhuma capa seleccionada</p>
                      <button
                        type="button"
                        onClick={handleCoverUploadMock}
                        className="mt-3 text-xs font-bold text-amber-500 hover:text-amber-400 flex items-center gap-1.5 cursor-pointer bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Gerar Capa de Arte
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Conditional Import area or AI Beats Switch */}
              {activeTab === "import" ? (
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">Ficheiro de Áudio Local</label>
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border border-dashed rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all h-28 cursor-pointer ${
                      dragActive 
                        ? "border-amber-500 bg-amber-500/10" 
                        : "border-zinc-800 hover:border-amber-500/40 bg-zinc-900/10"
                    }`}
                  >
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleAudioFileChange}
                      className="hidden"
                      id="audio-import-input"
                    />
                    <label htmlFor="audio-import-input" className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                      <Music className={`w-8 h-8 mb-1.5 transition-transform duration-300 ${audioFile ? "text-emerald-500 scale-110" : "text-zinc-600 group-hover:text-amber-500"}`} />
                      {audioFile ? (
                        <div className="max-w-full px-2">
                          <p className="text-xs font-bold text-emerald-400 truncate">
                            {audioFileName}
                          </p>
                          <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
                            Auto-detecção: {Math.floor(duration / 60)}:{(duration % 60) < 10 ? "0" : ""}{duration % 60}s
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-bold text-zinc-300">Seleccionar ou arrastar ficheiro</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">MP3, WAV, M4A, etc.</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" /> Sintetizador IA
                    </span>
                    <input
                      type="checkbox"
                      checked={useAIBeat}
                      onChange={(e) => setUseAIBeat(e.target.checked)}
                      className="w-4 h-4 accent-amber-500 cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Gera uma batida sintetizada personalizada com base no género. O nosso processador de áudio irá modelar o sintetizador de instrumentos tradicionais moçambicanos automaticamente.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-zinc-900 pt-5 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 font-semibold text-sm transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-bold text-sm transition-all shadow-lg cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Importando..." : activeTab === "import" ? "Importar Música" : "Lançar Faixa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
