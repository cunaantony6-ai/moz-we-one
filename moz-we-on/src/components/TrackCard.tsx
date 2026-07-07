import React from "react";
import { Play, Pause, Heart, MessageSquare, Flame, Check, Download } from "lucide-react";
import { Track } from "../types";

interface TrackCardProps {
  key?: any;
  track: Track;
  onPlay: (track: Track) => any;
  isPlaying: boolean;
  onLike: (trackId: string) => any;
  hasLiked: boolean;
  onSelectTrack: (track: Track) => any;
  isOfflineCached?: boolean;
  onToggleOfflineCache?: (track: Track, e: React.MouseEvent) => any;
}

export default function TrackCard({
  track,
  onPlay,
  isPlaying,
  onLike,
  hasLiked,
  onSelectTrack,
  isOfflineCached = false,
  onToggleOfflineCache
}: TrackCardProps) {
  // Get custom badge gradient based on genre
  const getGenreBadge = (genre: string) => {
    switch (genre) {
      case "Marrabenta":
        return "from-amber-500 to-yellow-400 text-zinc-950";
      case "Amapiano":
        return "from-purple-600 to-indigo-500 text-white";
      case "Kizomba":
        return "from-pink-600 to-rose-500 text-white";
      case "Pandza":
        return "from-red-600 to-orange-500 text-white";
      case "Afro House":
        return "from-emerald-600 to-teal-500 text-white";
      default:
        return "from-zinc-700 to-zinc-600 text-zinc-200";
    }
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLike(track.id);
  };

  return (
    <div
      id={`track-card-${track.id}`}
      className="bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800/80 rounded-2xl p-4 flex flex-col gap-4 transition-all duration-300 group cursor-pointer"
      onClick={() => onSelectTrack(track)}
    >
      {/* Cover Image and Play Overlay */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-zinc-950 shadow-md">
        <img
          src={track.coverUrl}
          alt={track.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />

        {/* Backdrop filter cover hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlay(track);
            }}
            className="w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center justify-center transform scale-90 group-hover:scale-100 transition-all duration-300 shadow-lg cursor-pointer active:scale-95"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current translate-x-0.5" />
            )}
          </button>
        </div>

        {/* Genre Pill Badge */}
        <span className={`absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full bg-gradient-to-r shadow-md uppercase tracking-wider font-sans ${getGenreBadge(track.genre)}`}>
          {track.genre}
        </span>

        {/* Offline Cache Status Icon Button */}
        {onToggleOfflineCache && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleOfflineCache(track, e);
            }}
            className={`absolute top-3 right-3 p-1.5 rounded-full backdrop-blur-md border shadow-md transition-all duration-300 z-10 cursor-pointer ${
              isOfflineCached
                ? "bg-emerald-500/95 text-white border-emerald-400 hover:bg-rose-600 hover:border-rose-500 hover:text-white"
                : "bg-zinc-950/80 text-zinc-400 border-zinc-800 hover:text-amber-400 hover:border-amber-500/50"
            }`}
            title={isOfflineCached ? "Remover do Cache Offline" : "Guardar para ouvir Offline"}
          >
            {isOfflineCached ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
          </button>
        )}

        {/* Audio play indicator (Equalizer animation) */}
        {isPlaying && (
          <div className="absolute bottom-3 right-3 bg-zinc-950/80 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1 border border-zinc-800/50">
            <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span className="text-[9px] font-mono font-bold text-amber-500 uppercase tracking-widest">A tocar</span>
          </div>
        )}
      </div>

      {/* Metadata & Title */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-display font-bold text-sm text-zinc-100 group-hover:text-amber-400 transition-colors truncate">
              {track.title}
            </h3>
            <p className="text-xs text-zinc-400 truncate font-sans">{track.artist}</p>
          </div>
        </div>

        {/* Tiny Soundwave representation for visual flair */}
        <div className="flex items-end gap-[2px] h-6 my-1 opacity-70 group-hover:opacity-100 transition-opacity">
          {track.waveform.slice(0, 24).map((h, i) => (
            <div
              key={i}
              className={`w-[3px] rounded-t-sm transition-all duration-300 ${
                isPlaying ? "bg-amber-500" : "bg-zinc-700 group-hover:bg-zinc-600"
              }`}
              style={{
                height: `${h * 100}%`,
                animationDelay: `${i * 30}ms`,
                animationDuration: "1s"
              }}
            />
          ))}
        </div>

        {/* Social stats & play counts */}
        <div className="flex items-center justify-between border-t border-zinc-900 pt-3 text-[11px] text-zinc-500 font-mono">
          <span className="truncate">{track.playCount.toLocaleString()} plays</span>
          <div className="flex items-center gap-3">
            <button
              onClick={handleLikeClick}
              className={`flex items-center gap-1 hover:text-rose-500 transition-colors cursor-pointer group/like ${
                hasLiked ? "text-rose-500 font-bold" : ""
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${hasLiked ? "fill-current" : ""}`} />
              <span>{track.likesCount}</span>
            </button>
            <div className="flex items-center gap-1 hover:text-zinc-300 transition-colors">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{track.commentsCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
