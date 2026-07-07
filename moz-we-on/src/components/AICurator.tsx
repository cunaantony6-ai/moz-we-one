import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Sparkles, Music, Play, AlertCircle } from "lucide-react";
import { ChatMessage, Track } from "../types";

interface AICuratorProps {
  chatHistory: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isGenerating: boolean;
  tracks: Track[];
  onPlayTrack: (track: Track) => void;
  currentPlayingTrack: Track | null;
}

export default function AICurator({
  chatHistory,
  onSendMessage,
  isGenerating,
  tracks,
  onPlayTrack,
  currentPlayingTrack
}: AICuratorProps) {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    "Quero dançar Pandza rápido!",
    "Recomenda-me um Amapiano de Maputo",
    "Gostaria de uma Kizomba romântica",
    "Explica o que é Marrabenta",
    "Qual é a melhor fusão com Timbila?"
  ];

  // Scroll to bottom when history updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isGenerating]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isGenerating) return;
    onSendMessage(inputText);
    setInputText("");
  };

  const handleQuickPromptClick = (prompt: string) => {
    if (isGenerating) return;
    onSendMessage(prompt);
  };

  return (
    <div id="ai-curator-container" className="flex flex-col h-full bg-zinc-950 text-zinc-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-600 flex items-center justify-center animate-pulse">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-zinc-100 flex items-center gap-2">
              DJ Moz AI <span className="text-xs bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded font-mono font-normal">Sintonizado</span>
            </h2>
            <p className="text-xs text-zinc-400">O seu guia e curador dos ritmos mais quentes de Moçambique</p>
          </div>
        </div>
      </div>

      {/* Messages Window */}
      <div className="flex-1 overflow-y-auto mb-4 pr-2 space-y-4 max-h-[calc(100vh-320px)] min-h-[300px]">
        {chatHistory.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-10 px-4">
            <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4 border border-zinc-800 text-amber-500">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="font-display font-bold text-base text-zinc-200">Benvindo ao Moz We On, madié!</h3>
            <p className="text-sm text-zinc-400 max-w-md mt-2">
              Senta aqui com o <strong className="text-amber-500">DJ Moz</strong>. Diz-me qual é a tua vibe, de onde és ou que ritmo queres curtir. Eu vou-te txunar a melhor seleção de Moçambique!
            </p>
          </div>
        )}

        {chatHistory.map((message) => {
          const isUser = message.sender === "user";
          return (
            <div
              key={message.id}
              className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fadeIn`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-4 shadow-md ${
                  isUser
                    ? "bg-amber-500 text-zinc-950 font-medium rounded-tr-none"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-tl-none"
                }`}
              >
                {/* Meta details */}
                <div className="flex items-center gap-2 mb-1.5 text-[10px] font-mono tracking-wider opacity-60">
                  <span>{isUser ? "Você" : "DJ Moz"}</span>
                  <span>•</span>
                  <span>{message.timestamp}</span>
                </div>

                {/* Message Text */}
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>

                {/* Suggested Tracks Embed */}
                {!isUser && message.suggestedTracks && message.suggestedTracks.length > 0 && (
                  <div className="mt-4 border-t border-zinc-800/80 pt-3 space-y-2">
                    <p className="text-[11px] font-mono text-amber-500 flex items-center gap-1.5 uppercase font-semibold">
                      <Music className="w-3.5 h-3.5" /> Faixas Selecionadas pelo DJ:
                    </p>
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      {message.suggestedTracks.map((trackId) => {
                        const track = tracks.find((t) => t.id === trackId);
                        if (!track) return null;
                        const isCurrent = currentPlayingTrack?.id === track.id;
                        return (
                          <div
                            key={track.id}
                            className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/80 border border-zinc-800/50 hover:border-amber-500/30 transition-all group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={track.coverUrl}
                                alt={track.title}
                                className="w-8 h-8 rounded-lg object-cover"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-zinc-200 truncate">{track.title}</p>
                                <p className="text-[10px] text-zinc-400 truncate">{track.artist} • <span className="text-amber-500">{track.genre}</span></p>
                              </div>
                            </div>
                            <button
                              onClick={() => onPlayTrack(track)}
                              className={`p-2 rounded-full cursor-pointer flex items-center justify-center transition-all ${
                                isCurrent
                                  ? "bg-amber-500 text-zinc-950 scale-105"
                                  : "bg-zinc-800 hover:bg-amber-500 text-zinc-100 hover:text-zinc-950"
                              }`}
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isGenerating && (
          <div className="flex justify-start">
            <div className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-2xl rounded-tl-none p-4 max-w-[80%] flex items-center gap-2">
              <span className="text-xs font-mono text-zinc-400">DJ Moz está a misturar</span>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick suggestions chips */}
      <div className="mb-4">
        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">Sugestões rápidas:</p>
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickPromptClick(p)}
              disabled={isGenerating}
              className="text-xs bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white px-3 py-1.5 rounded-full transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Form Input */}
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Pergunta ao DJ Moz ou diz o que queres curtir..."
          disabled={isGenerating}
          className="w-full bg-zinc-900 hover:bg-zinc-900/80 focus:bg-zinc-900 border border-zinc-800 focus:border-amber-500 text-sm rounded-2xl py-4 pl-4 pr-14 text-zinc-100 placeholder-zinc-500 outline-none transition-all"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isGenerating}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-amber-500 text-zinc-950 font-bold hover:bg-amber-400 transition-all disabled:opacity-50 disabled:hover:bg-amber-500 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
