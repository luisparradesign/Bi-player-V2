import React from 'react';
import { usePlayer } from '../context/PlayerContext';
import { Play, Pause, Square, Volume2, VolumeX, FolderOpen, Layers, EyeOff, Eye } from 'lucide-react';

interface TopBarProps {
  onOpenSelector: () => void;
  onSelectRoot: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenSelector, onSelectRoot }) => {
  const { 
    playAll, pauseAll, stopAll, 
    catalog, panelsHidden, togglePanels,
    globalMute, setGlobalMute
  } = usePlayer();

  if (panelsHidden) return null;

  return (
    <header className="relative z-30 flex flex-col gap-2 p-3 bg-slate-900/90 backdrop-blur-md border-b border-white/10 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            B7
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-100 leading-none">BiPlayer Next</h1>
            <span className="text-xs text-slate-500">Professional Mixer</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <button 
            onClick={onSelectRoot}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
           >
             <FolderOpen size={14} />
             {catalog ? 'Change Source' : 'Load Folder'}
           </button>
           <button 
            onClick={onOpenSelector}
            disabled={!catalog}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors"
           >
             <Layers size={14} />
             Library
           </button>
        </div>
      </div>

      <div className="flex items-center justify-center md:justify-start bg-slate-950/50 p-2 rounded-lg border border-white/5">
        <div className="flex items-center gap-1 w-full md:w-auto justify-center">
            <button onClick={playAll} className="p-2 rounded hover:bg-slate-800 text-green-400 transition-colors" title="Play All">
                <Play size={16} fill="currentColor" />
            </button>
            <button onClick={pauseAll} className="p-2 rounded hover:bg-slate-800 text-amber-400 transition-colors" title="Pause All">
                <Pause size={16} fill="currentColor" />
            </button>
            <button onClick={stopAll} className="p-2 rounded hover:bg-slate-800 text-red-400 transition-colors" title="Stop All">
                <Square size={16} fill="currentColor" />
            </button>
             <div className="w-px h-6 bg-white/10 mx-2"></div>
             <button onClick={() => setGlobalMute(!globalMute)} className={`p-2 rounded hover:bg-slate-800 transition-colors ${globalMute ? 'text-red-500' : 'text-slate-400'}`} title="Toggle Mute">
                {globalMute ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <button onClick={() => setGlobalMute(false)} className="px-3 py-1 rounded bg-slate-800 text-xs hover:bg-slate-700 transition-colors text-slate-300">
                Unmute All
            </button>
        </div>
      </div>
    </header>
  );
};

export const FloatingControls = () => {
    const { togglePanels, panelsHidden } = usePlayer();
    
    return (
        <button 
            onClick={togglePanels}
            className="fixed top-4 right-4 z-50 p-2 rounded-full bg-slate-900/80 backdrop-blur border border-white/10 text-white shadow-xl hover:bg-indigo-600 transition-colors"
            title={panelsHidden ? "Show Panels" : "Hide Panels (H)"}
        >
            {panelsHidden ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
    )
}