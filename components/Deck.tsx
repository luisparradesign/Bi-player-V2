import React, { useMemo, useState } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { MediaCard } from './MediaCard';
import { Category, DeckItem } from '../types';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Slider } from './Slider';

export const Deck: React.FC = () => {
  const { deckItems, panelsHidden, masterVolume, setMasterVolume } = usePlayer();
  
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
      [Category.Visual]: false,
      [Category.Ambient]: false,
      [Category.Music]: false,
  });

  const groupedItems = useMemo(() => {
    return {
        [Category.Visual]: deckItems.filter(i => i.category === Category.Visual),
        [Category.Ambient]: deckItems.filter(i => i.category === Category.Ambient),
        [Category.Music]: deckItems.filter(i => i.category === Category.Music),
    };
  }, [deckItems]);

  const toggleCollapse = (cat: string) => {
      setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const renderSection = (title: string, items: DeckItem[], color: string, cat: Category) => {
      const isCollapsed = collapsed[cat];
      const hasItems = items.length > 0;

      const widthClasses = isCollapsed 
        ? 'w-[30px] md:w-[40px] bg-slate-950/30' 
        : 'w-auto bg-slate-900/5'; 

      return (
        <div 
            className={`flex flex-col h-full border-r border-white/5 last:border-r-0 transition-all duration-300 relative flex-none ${widthClasses}`}
        >
            {/* Minimal Header */}
            <div 
                onClick={() => toggleCollapse(cat)}
                className={`flex items-center justify-between px-2 py-1 border-b border-white/5 cursor-pointer hover:bg-white/5 select-none w-full
                ${isCollapsed ? 'flex-col justify-start h-full py-4 gap-2' : 'bg-slate-900/10 backdrop-blur-sm'}`}
            >
                <div className={`flex items-center gap-2 ${isCollapsed ? '[writing-mode:vertical-rl] rotate-180 mt-2' : ''}`}>
                    <div className={`w-1.5 h-1.5 rounded-full bg-${color}-500 shadow-[0_0_5px_currentColor]`} />
                    <span className={`text-[9px] font-bold uppercase tracking-widest text-slate-300 truncate`}>
                        {title}
                    </span>
                    {!isCollapsed && hasItems && <span className="text-[9px] text-slate-600 bg-slate-950/50 px-1 rounded">{items.length}</span>}
                </div>
                <button className={`text-slate-600 hover:text-slate-300 transition-colors ${isCollapsed ? 'rotate-90' : ''}`}>
                    {isCollapsed ? <ChevronRight size={10} /> : <ChevronLeft size={10} />}
                </button>
            </div>

            {/* Content Area - Fixed: Uses 'hidden' to preserve playback state */}
            <div className={`flex-1 flex gap-2 p-2 items-center bg-gradient-to-b from-transparent to-black/5 ${isCollapsed ? 'hidden' : 'flex'}`}>
                {hasItems ? (
                    items.map(item => (
                        <div key={item.deckId} className="flex-shrink-0 h-full flex items-center">
                            <MediaCard item={item} collapsed={false} />
                        </div>
                    ))
                ) : (
                    <div className="w-24 h-full flex flex-col items-center justify-center opacity-30 text-[9px] uppercase tracking-widest text-slate-400 flex-shrink-0 mix-blend-overlay">
                        Empty
                    </div>
                )}
                <div className="w-1 flex-shrink-0"></div>
            </div>
        </div>
      );
  };

  return (
    <section 
        className={`relative z-20 bg-slate-950/20 backdrop-blur-sm border-t border-white/10 shadow-2xl flex flex-col shrink-0 transition-all duration-500 ease-in-out
        h-[260px] pb-2
        ${panelsHidden ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}
    >
      <div className="flex-1 flex w-full overflow-hidden bg-gradient-to-t from-slate-950/40 via-transparent to-transparent">
         
         {/* Categories Rack (Global Scroll) */}
         <div className="flex-1 flex overflow-x-auto overflow-y-hidden justify-start custom-scroll">
            {deckItems.length === 0 ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500/50 space-y-3 select-none pointer-events-none">
                    <div className="w-16 h-16 border border-slate-700/30 rounded-xl flex items-center justify-center shadow-inner bg-black/10 backdrop-blur-sm">
                       <div className="w-12 h-1 bg-slate-700/30 rounded-full"></div>
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.3em] drop-shadow-md">System Ready</p>
                </div>
            ) : (
                <>
                   {renderSection('Visuals', groupedItems[Category.Visual], 'indigo', Category.Visual)}
                   {renderSection('Ambient', groupedItems[Category.Ambient], 'emerald', Category.Ambient)}
                   {renderSection('Music', groupedItems[Category.Music], 'pink', Category.Music)}
                </>
            )}
         </div>

         {/* MASTER CHANNEL STRIP */}
         <div className="h-full flex flex-col items-center bg-slate-950/30 backdrop-blur-sm border-l border-white/5 w-[45px] md:w-[50px] shrink-0 z-30 shadow-[-5px_0_20px_rgba(0,0,0,0.1)]">
            <div className="w-full py-2 flex items-center justify-center border-b border-white/5 bg-slate-900/10">
                 <div className="text-[8px] font-bold uppercase tracking-widest text-purple-400 [writing-mode:vertical-rl] rotate-180 py-2">Master</div>
            </div>
            <div className="flex-1 w-full px-4 py-3 group">
                <Slider
                    vertical
                    value={masterVolume}
                    min={0}
                    max={1}
                    onChange={setMasterVolume}
                    trackColorStart="#a855f7"
                    trackColorEnd="#6366f1"
                    className="h-full w-full"
                />
            </div>
            <div className="pb-3 text-[9px] font-mono text-purple-300 font-bold drop-shadow-md">
                {Math.round(masterVolume * 100)}%
            </div>
        </div>

      </div>
    </section>
  );
};