import { Home, Music, Compass, MessageSquareCode, Library, ListMusic, PlusCircle, Headset } from "lucide-react";

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openUploadModal: () => void;
  likesCount: number;
  playlistCount: number;
}

export default function Sidebar({
  currentTab,
  setCurrentTab,
  openUploadModal,
  likesCount,
  playlistCount
}: SidebarProps) {
  const menuItems = [
    { id: "explore", name: "Explorar", icon: Compass },
    { id: "library", name: "Biblioteca", icon: Library },
    { id: "playlists", name: "Playlists", icon: ListMusic },
    { id: "dj-ai", name: "DJ Moz AI", icon: MessageSquareCode, badge: "On" },
  ];

  return (
    <aside id="app-sidebar" className="w-64 bg-zinc-950 border-r border-zinc-900 flex flex-col h-full text-zinc-100 select-none">
      {/* Brand Logo Header */}
      <div className="p-6 border-b border-zinc-900 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-950/40">
          <Headset className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-display font-bold text-lg leading-tight tracking-wider bg-gradient-to-r from-amber-400 to-rose-500 bg-clip-text text-transparent">
            MOZ WE ON
          </h1>
          <p className="text-[10px] text-zinc-500 font-mono tracking-widest">STREAMING PORTAL</p>
        </div>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 mb-2">
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider font-mono">Navegação</p>
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`sidebar-nav-${item.id}`}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-zinc-900 to-zinc-900/60 text-amber-500 border-l-2 border-amber-500 pl-2"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${isActive ? "text-amber-500" : "text-zinc-400"}`} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-rose-600 text-white rounded-full font-mono uppercase animate-pulse">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-6 px-3 mb-2">
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider font-mono">Sua Actividade</p>
        </div>
        <div className="space-y-1 text-sm text-zinc-400 px-3">
          <div className="flex items-center justify-between py-1.5">
            <span className="flex items-center gap-2"><Music className="w-4 h-4 text-zinc-500" /> Gosta:</span>
            <span className="font-mono text-xs font-bold text-amber-500">{likesCount}</span>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="flex items-center gap-2"><ListMusic className="w-4 h-4 text-zinc-500" /> Playlists:</span>
            <span className="font-mono text-xs font-bold text-amber-500">{playlistCount}</span>
          </div>
        </div>
      </nav>

      {/* Bottom Upload Section */}
      <div className="p-4 border-t border-zinc-900 bg-zinc-950/80">
        <button
          id="sidebar-upload-btn"
          onClick={openUploadModal}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-semibold text-sm transition-all duration-300 shadow-md shadow-amber-950/20 active:scale-95 cursor-pointer"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Lançar Música</span>
        </button>
        <p className="text-[10px] text-zinc-500 text-center mt-3 font-sans">
          Fazer upload de batidas locais
        </p>
      </div>
    </aside>
  );
}
