import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Shuffle, RotateCcw, Flame } from "lucide-react";
import { Track } from "../types";
import { RhythmicSynthEngine } from "../lib/audioEngine";

interface AudioPlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  onNext: () => void;
  onPrev: () => void;
}

// Single persistent instance of our procedural audio engine
const synthEngine = new RhythmicSynthEngine();

export default function AudioPlayer({
  currentTrack,
  isPlaying,
  setIsPlaying,
  onNext,
  onPrev
}: AudioPlayerProps) {
  const [progress, setProgress] = useState(0); // in seconds
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);

  const progressIntervalRef = useRef<any>(null);

  const realAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize realAudio element once
  useEffect(() => {
    realAudioRef.current = new Audio();
    
    return () => {
      if (realAudioRef.current) {
        realAudioRef.current.pause();
        realAudioRef.current = null;
      }
    };
  }, []);

  // Sync state with synthesized engine or real audio
  useEffect(() => {
    if (!currentTrack) return;
    const audio = realAudioRef.current;
    const isSynthetic = currentTrack.audioUrl.startsWith("synth:");

    if (isPlaying) {
      if (isSynthetic) {
        if (audio) {
          audio.pause();
        }
        synthEngine.play(currentTrack.audioUrl);
      } else {
        synthEngine.stop();
        if (audio) {
          if (audio.src !== currentTrack.audioUrl) {
            audio.src = currentTrack.audioUrl;
          }
          audio.play().catch((err) => console.error("Error playing imported audio:", err));
        }
      }

      // Progress interval
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (!isSynthetic && audio) {
            const curTime = Math.floor(audio.currentTime);
            if (curTime >= currentTrack.duration) {
              if (repeat) {
                audio.currentTime = 0;
                return 0;
              } else {
                setIsPlaying(false);
                onNext();
                return 0;
              }
            }
            return curTime;
          }

          if (prev >= currentTrack.duration) {
            if (repeat) {
              return 0; // loop back
            } else {
              setIsPlaying(false);
              onNext(); // play next
              return 0;
            }
          }
          return prev + 1;
        });
      }, 500);
    } else {
      synthEngine.stop();
      if (audio) {
        audio.pause();
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [currentTrack, isPlaying, repeat]);

  // Handle Track change
  useEffect(() => {
    setProgress(0);
  }, [currentTrack]);

  // Sync volume changes
  useEffect(() => {
    const targetVolume = isMuted ? 0 : volume;
    synthEngine.setVolume(targetVolume);
    if (realAudioRef.current) {
      realAudioRef.current.volume = targetVolume;
    }
  }, [volume, isMuted]);

  if (!currentTrack) return null;

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (isMuted) setIsMuted(false);
  };

  // Skip to a specific point on the waveform
  const handleWaveSeek = (index: number, total: number) => {
    const clickRatio = index / total;
    const newProgress = Math.floor(clickRatio * currentTrack.duration);
    setProgress(newProgress);
    
    const isSynthetic = currentTrack.audioUrl.startsWith("synth:");
    if (!isSynthetic && realAudioRef.current) {
      realAudioRef.current.currentTime = newProgress;
    }
  };

  // Formatting seconds to MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div
      id="global-audio-player"
      className="fixed bottom-0 left-0 right-0 h-24 bg-zinc-950 border-t border-zinc-900 px-6 flex items-center justify-between z-40 select-none shadow-2xl backdrop-blur-md"
    >
      {/* 1. Track Details (Left) */}
      <div className="flex items-center gap-4 w-1/4 min-w-[200px]">
        <img
          src={currentTrack.coverUrl}
          alt={currentTrack.title}
          className="w-14 h-14 rounded-xl object-cover border border-zinc-900 shadow-md animate-spin-slow-conditional"
          style={{ animationPlayState: isPlaying ? "running" : "paused" }}
          referrerPolicy="no-referrer"
        />
        <div className="min-w-0">
          <h4 className="font-display font-bold text-sm text-zinc-100 truncate hover:text-amber-400 transition-colors cursor-pointer">
            {currentTrack.title}
          </h4>
          <p className="text-xs text-zinc-400 truncate mt-0.5">{currentTrack.artist}</p>
          <span className="inline-block mt-1 text-[9px] font-mono font-bold bg-amber-500/15 text-amber-500 px-1.5 py-0.5 rounded uppercase tracking-wider">
            {currentTrack.genre}
          </span>
        </div>
      </div>

      {/* 2. Playback Core Controls & SoundCloud Wave Scrubbing (Center) */}
      <div className="flex flex-col items-center gap-2.5 w-2/4 max-w-xl">
        {/* Buttons Row */}
        <div className="flex items-center gap-5">
          <button
            onClick={() => setShuffle(!shuffle)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              shuffle ? "text-amber-500" : "text-zinc-500 hover:text-zinc-300"
            }`}
            title="Baralhar"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            onClick={onPrev}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-all cursor-pointer"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          <button
            onClick={togglePlay}
            className="w-11 h-11 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current translate-x-0.5" />
            )}
          </button>

          <button
            onClick={onNext}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-all cursor-pointer"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          <button
            onClick={() => setRepeat(!repeat)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              repeat ? "text-amber-500" : "text-zinc-500 hover:text-zinc-300"
            }`}
            title="Repetir"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* SoundCloud Timeline Scrubbing Wave */}
        <div className="w-full flex items-center gap-3">
          <span className="text-[10px] font-mono text-zinc-500 min-w-[32px] text-right">
            {formatTime(progress)}
          </span>

          {/* Interactive Wave Bar */}
          <div className="flex-1 flex items-end gap-[1.5px] h-7 cursor-pointer group/wave py-1 select-none">
            {currentTrack.waveform.map((h, i, arr) => {
              const barProgressRatio = i / arr.length;
              const trackProgressRatio = progress / currentTrack.duration;
              const isActive = barProgressRatio <= trackProgressRatio;

              return (
                <div
                  key={i}
                  onClick={() => handleWaveSeek(i, arr.length)}
                  className={`w-full rounded-t-sm transition-all hover:scale-y-110 ${
                    isActive
                      ? "bg-amber-500 shadow-sm shadow-amber-500/10"
                      : "bg-zinc-800 group-hover/wave:bg-zinc-700"
                  }`}
                  style={{
                    height: `${Math.max(15, h * 100)}%`,
                  }}
                />
              );
            })}
          </div>

          <span className="text-[10px] font-mono text-zinc-500 min-w-[32px]">
            {formatTime(currentTrack.duration)}
          </span>
        </div>
      </div>

      {/* 3. Volumetric Audio HUD (Right) */}
      <div className="flex items-center justify-end gap-3 w-1/4 min-w-[150px]">
        {/* Simple Equalizer Visualizer */}
        {isPlaying && (
          <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-md mr-3">
            <Flame className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
            <span className="text-[9px] font-mono font-bold text-amber-500 uppercase">
              {currentTrack.audioUrl.startsWith("synth:") ? "SYNTH LIVE" : "IMPORTED"}
            </span>
          </div>
        )}

        <button
          onClick={handleMuteToggle}
          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="w-4 h-4 text-rose-500" />
          ) : (
            <Volume2 className="w-4 h-4 text-zinc-400" />
          )}
        </button>

        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          className="w-20 accent-amber-500 bg-zinc-800 h-1 rounded-lg cursor-pointer hover:bg-zinc-700 outline-none"
        />
      </div>
    </div>
  );
}
