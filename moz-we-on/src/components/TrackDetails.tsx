import React, { useState, useEffect } from "react";
import { X, Play, Pause, Heart, MessageSquare, Clock, Send, Flame } from "lucide-react";
import { Track, Comment } from "../types";

interface TrackDetailsProps {
  track: Track;
  isPlaying: boolean;
  onPlay: (track: Track) => void;
  onClose: () => void;
  onLike: (trackId: string) => void;
  hasLiked: boolean;
  currentPlayingTrack: Track | null;
}

export default function TrackDetails({
  track,
  isPlaying,
  onPlay,
  onClose,
  onLike,
  hasLiked,
  currentPlayingTrack
}: TrackDetailsProps) {
  const [commentText, setCommentText] = useState("");
  const [commentsList, setCommentsList] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  const fetchComments = async () => {
    setIsLoadingComments(true);
    try {
      const response = await fetch(`/api/tracks/${track.id}/comments`);
      if (response.ok) {
        const data = await response.json();
        setCommentsList(data);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [track.id]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    // Post comment payload, randomly picking a nice local Moz name if empty
    const usernames = ["Gisela de Maputo", "Dércio de Xai-Xai", "Beto_Beira", "Sara de Inhambane", "Nélio de Nampula"];
    const username = usernames[Math.floor(Math.random() * usernames.length)];

    const payload = {
      username,
      text: commentText,
      timestamp: Math.floor(Math.random() * track.duration), // Random moment in the track
      userAvatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${username}`
    };

    try {
      const response = await fetch(`/api/tracks/${track.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const newComment = await response.json();
        setCommentsList((prev) => [...prev, newComment]);
        setCommentText("");
        // Trigger a refresh or local counter sync
        track.commentsCount += 1;
      }
    } catch (error) {
      console.error("Error posting comment:", error);
    }
  };

  const isCurrent = currentPlayingTrack?.id === track.id;

  // Formatting seconds to MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div id="track-details-slideover" className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-zinc-950 border-l border-zinc-900 shadow-2xl z-50 flex flex-col animate-slideLeft text-zinc-100">
      {/* Scrollable Container */}
      <div className="flex-1 overflow-y-auto pb-24">
        {/* Banner Hero */}
        <div className="relative h-72 w-full bg-gradient-to-b from-amber-600/30 to-zinc-950 p-6 flex flex-col justify-between border-b border-zinc-900 overflow-hidden">
          {/* Blurred Background cover art */}
          <div className="absolute inset-0 z-0 opacity-10">
            <img src={track.coverUrl} alt="" className="w-full h-full object-cover blur-2xl" />
          </div>

          {/* Top Actions */}
          <div className="relative z-10 flex justify-between items-center">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full border border-amber-500/10">
              {track.genre}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-100 border border-zinc-800/40 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Banner Meta details */}
          <div className="relative z-10 flex gap-6 items-end">
            <img
              src={track.coverUrl}
              alt={track.title}
              className="w-28 h-28 rounded-2xl object-cover shadow-2xl border border-zinc-800 shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0">
              <h2 className="font-display font-black text-2xl tracking-tight text-white mb-1 leading-tight truncate">
                {track.title}
              </h2>
              <p className="text-zinc-300 font-medium text-sm truncate">{track.artist}</p>
              <p className="text-[11px] text-zinc-500 font-mono mt-2 flex items-center gap-1">
                Lançado em {new Date(track.createdAt).toLocaleDateString("pt-MZ")} • por {track.uploadedBy}
              </p>
            </div>
          </div>
        </div>

        {/* Play & Wave Bar Section */}
        <div className="p-6 border-b border-zinc-900 bg-zinc-900/10">
          <div className="flex items-center gap-4 mb-5">
            <button
              onClick={() => onPlay(track)}
              className="py-3 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm flex items-center gap-2 shadow-lg cursor-pointer transform hover:scale-[1.02] active:scale-95 transition-all"
            >
              {isCurrent && isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pausar</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current translate-x-0.5" />
                  <span>Ouvir Batida</span>
                </>
              )}
            </button>

            <button
              onClick={() => onLike(track.id)}
              className={`py-3 px-5 rounded-2xl border transition-all flex items-center gap-2 font-medium text-sm cursor-pointer ${
                hasLiked
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-500 font-bold"
                  : "border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 text-zinc-300 hover:text-white"
              }`}
            >
              <Heart className={`w-4 h-4 ${hasLiked ? "fill-current" : ""}`} />
              <span>{track.likesCount} Gostos</span>
            </button>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">Sobre a Música</h4>
            <p className="text-sm text-zinc-300 leading-relaxed font-sans whitespace-pre-line">{track.description}</p>
          </div>
        </div>

        {/* Comments Feed Panel */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <h3 className="font-display font-bold text-base text-zinc-100 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-500" /> Comentários
              <span className="text-xs font-mono font-normal text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-full">
                {commentsList.length}
              </span>
            </h3>
          </div>

          {/* Add a comment box */}
          <form onSubmit={handlePostComment} className="flex gap-2">
            <input
              type="text"
              placeholder="Adiciona um comentário sobre este som..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-all placeholder-zinc-600"
            />
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="px-4 rounded-xl bg-amber-500 text-zinc-950 hover:bg-amber-400 font-bold flex items-center justify-center transition-all disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Comments List */}
          {isLoadingComments ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : commentsList.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-xs">
              Nenhum comentário por aqui ainda. Sê o primeiro a txunar um comentário!
            </div>
          ) : (
            <div className="space-y-3.5 mt-2">
              {commentsList.map((comment) => (
                <div key={comment.id} className="p-3.5 bg-zinc-900/30 border border-zinc-900/60 rounded-2xl flex gap-3.5 items-start">
                  <img
                    src={comment.userAvatar}
                    alt={comment.username}
                    className="w-9 h-9 rounded-xl object-cover shrink-0 border border-zinc-800"
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-zinc-200 truncate">{comment.username}</p>
                      <span className="text-[10px] font-mono font-bold text-amber-500 flex items-center gap-1 bg-amber-500/10 px-1.5 py-0.5 rounded">
                        <Clock className="w-3 h-3" /> {formatTime(comment.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed font-sans whitespace-pre-line">{comment.text}</p>
                    <p className="text-[9px] text-zinc-500 font-mono pt-1">
                      {new Date(comment.createdAt).toLocaleDateString("pt-MZ")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
