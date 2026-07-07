import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { PlayHistoryItem } from "../types";
import { Headphones, Flame, Trophy, Calendar } from "lucide-react";

interface GenreStatsProps {
  playHistory: PlayHistoryItem[];
  onClearHistory: () => void;
}

const GENRE_COLORS: Record<string, string> = {
  Marrabenta: "#f59e0b", // Amber
  Amapiano: "#9333ea",   // Purple
  Kizomba: "#db2777",    // Pink
  Pandza: "#dc2626",     // Red
  "Afro House": "#059669", // Emerald
  Outro: "#4b5563",      // Gray
};

export default function GenreStats({ playHistory, onClearHistory }: GenreStatsProps) {
  // Aggregate play count by genre
  const genreData = React.useMemo(() => {
    const counts: Record<string, number> = {
      Marrabenta: 0,
      Amapiano: 0,
      Kizomba: 0,
      Pandza: 0,
      "Afro House": 0,
    };

    playHistory.forEach((item) => {
      const genre = item.genre;
      if (counts[genre] !== undefined) {
        counts[genre]++;
      } else {
        counts[genre] = (counts[genre] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([name, value]) => ({
        name,
        value,
        color: GENRE_COLORS[name] || "#4b5563",
      }))
      .sort((a, b) => b.value - a.value); // sort descending
  }, [playHistory]);

  const totalPlays = playHistory.length;
  const topGenre = genreData[0]?.value > 0 ? genreData[0].name : "Nenhum";

  // Formatter for Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-zinc-950/95 border border-zinc-800 p-3 rounded-xl shadow-xl backdrop-blur-md">
          <p className="font-display font-bold text-xs text-zinc-100 mb-1">{data.name}</p>
          <p className="font-mono text-[10px] text-zinc-400">
            Reproduções: <span className="text-amber-400 font-bold">{data.value}</span>
          </p>
          {totalPlays > 0 && (
            <p className="font-mono text-[10px] text-zinc-500">
              Percentagem: {Math.round((data.value / totalPlays) * 100)}%
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div id="genre-stats-section" className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-display font-bold text-lg text-zinc-100 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" /> Os Teus Ritmos Mais Ouvidos
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">Estilo e preferências de audição em Moçambique</p>
        </div>
        
        {totalPlays > 8 && (
          <button
            id="clear-history-button"
            onClick={onClearHistory}
            className="text-[10px] font-mono text-zinc-500 hover:text-red-400 transition-colors cursor-pointer border border-zinc-800 hover:border-red-500/30 px-2.5 py-1 rounded-md bg-zinc-900/40"
          >
            Limpar Histórico
          </button>
        )}
      </div>

      {/* Grid of basic stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div id="stat-card-total-plays" className="bg-zinc-900/40 border border-zinc-900 p-4 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase text-zinc-500">Total tocado</p>
            <p className="font-display font-black text-xl text-zinc-100">{totalPlays}</p>
          </div>
        </div>

        <div id="stat-card-top-genre" className="bg-zinc-900/40 border border-zinc-900 p-4 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase text-zinc-500">Ritmo Favorito</p>
            <p className="font-display font-black text-sm text-zinc-100 truncate max-w-[120px]">{topGenre}</p>
          </div>
        </div>

        <div id="stat-card-last-played" className="bg-zinc-900/40 border border-zinc-900 p-4 rounded-xl flex items-center gap-3 col-span-2 md:col-span-1">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase text-zinc-500">Última Escuta</p>
            <p className="font-display font-semibold text-xs text-zinc-100 truncate max-w-[150px]">
              {playHistory.length > 0 
                ? playHistory[playHistory.length - 1].title 
                : "Sem registos"
              }
            </p>
          </div>
        </div>
      </div>

      {totalPlays === 0 ? (
        <div className="text-center py-12 bg-zinc-900/10 border border-zinc-900/50 rounded-xl">
          <p className="text-xs text-zinc-500">Ouve alguns sons para txunares o teu gráfico de ritmos favoritos!</p>
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={genreData}
              layout="vertical"
              margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
            >
              <XAxis 
                type="number" 
                stroke="#71717a" 
                fontSize={10} 
                fontFamily="monospace"
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                stroke="#e4e4e7" 
                fontSize={11}
                fontFamily="sans-serif"
                fontWeight="500"
                tickLine={false}
                axisLine={false}
                width={85}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(39, 39, 42, 0.3)" }} />
              <Bar 
                dataKey="value" 
                radius={[0, 8, 8, 0]} 
                barSize={18}
              >
                {genreData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
