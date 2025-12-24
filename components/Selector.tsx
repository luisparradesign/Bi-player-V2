import React, { useState, useMemo, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { MediaFile } from '../types';
import { Check, Grid, List, Image as ImageIcon, ChevronDown, ChevronRight, Folder, LayoutGrid, Sparkles } from 'lucide-react';
import { generateAIThumbnail, generateThumbnail } from '../utils/fileHelpers';

interface SelectorProps {
  onClose: () => void;
}

type TabType = 'visuals' | 'ambient' | 'music';

export const Selector: React.FC<SelectorProps> = ({ onClose }) => {
  const { catalog, addToDeck } = usePlayer();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<TabType>('visuals');
  const [expandedMusicGroups, setExpandedMusicGroups] = useState<Record<string, boolean>>({});

  if (!catalog) return null;

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectGroup = (items: MediaFile[], e: React.MouseEvent) => {
      e.stopPropagation();
      const next = new Set(selectedIds);
      items.forEach(i => next.add(i.id));
      setSelectedIds(next);
  }

  const toggleMusicGroup = (groupName: string) => {
      setExpandedMusicGroups(prev => ({
          ...prev,
          [groupName]: !prev[groupName]
      }));
  };

  const handleImport = () => {
    const itemsToAdd: MediaFile[] = [];
    const findAndAdd = (list: MediaFile[]) => {
        list.forEach(i => {
            if (selectedIds.has(i.id)) itemsToAdd.push(i);
        });
    };
    findAndAdd(catalog.ambient);
    findAndAdd(catalog.visuals);
    findAndAdd(catalog.music);
    addToDeck(itemsToAdd);
    onClose();
  };

  // --- Row Component with AI Intelligence ---
  const ItemRow: React.FC<{ item: MediaFile, colorClass: string }> = ({ item, colorClass }) => {
      const isSelected = selectedIds.has(item.id);
      const [localThumb, setLocalThumb] = useState<string | null>(null);
      const [isGenerating, setIsGenerating] = useState(false);
      
      useEffect(() => {
          const loadThumbnail = async () => {
              // 1. Check physical catalog
              if (catalog) {
                  const key = item.relPath.replace(/\.[^.]+$/, '');
                  const file = catalog.thumbnails[key];
                  if (file) {
                      setLocalThumb(URL.createObjectURL(file));
                      return;
                  }
              }

              // 2. If video, try fast capture
              if (item.type === 'video') {
                  const videoT = await generateThumbnail(item.url);
                  if (videoT) {
                      setLocalThumb(videoT);
                      return;
                  }
              }

              // 3. Last fallback: Generate or fetch from AI cache
              setIsGenerating(true);
              const aiT = await generateAIThumbnail(item.name);
              setLocalThumb(aiT);
              setIsGenerating(false);
          };

          loadThumbnail();
      }, [item, catalog]);

      return (
        <div 
            onClick={() => toggleSelection(item.id)}
            className={`group relative overflow-hidden cursor-pointer flex items-center gap-3 p-2 rounded-lg border transition-all duration-300 w-full
            ${isSelected ? `bg-slate-900 border-${colorClass}-500 ring-1 ring-${colorClass}-500 shadow-xl` : 'bg-slate-900/40 border-white/5 hover:border-white/10'}`}
        >
            {/* Background Blur Image */}
            <div 
                className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 pointer-events-none opacity-10 blur-sm
                ${isSelected ? 'opacity-20 scale-110' : 'group-hover:opacity-15'}`}
                style={{ backgroundImage: localThumb ? `url(${localThumb})` : undefined }}
            ></div>
            
            <div className="absolute inset-0 bg-slate-950/60 pointer-events-none"></div>

            {/* Thumbnail Box - 1:1 Aspect Ratio Coherent */}
            <div className="relative z-10 w-10 h-10 rounded-md overflow-hidden flex-shrink-0 border border-white/10 shadow-lg bg-slate-900 flex items-center justify-center">
                {localThumb ? (
                    <img src={localThumb} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : isGenerating ? (
                    <div className="animate-pulse">
                        <Sparkles size={14} className={`text-${colorClass}-400 animate-spin`} />
                    </div>
                ) : (
                    <ImageIcon size={14} className="text-slate-700" />
                )}
                {isSelected && (
                    <div className={`absolute inset-0 bg-${colorClass}-500/60 backdrop-blur-[1px] flex items-center justify-center`}>
                        <Check size={16} className="text-white drop-shadow-md" />
                    </div>
                )}
            </div>
            
            <div className="relative z-10 flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-100 truncate flex items-center gap-2">
                    {item.name}
                    {!catalog?.thumbnails[item.relPath.replace(/\.[^.]+$/, '')] && localThumb && !isGenerating && (
                        <Sparkles size={10} className="text-amber-400 opacity-50" title="AI Generated Illustration" />
                    )}
                </div>
                <div className="text-[9px] text-slate-500 truncate opacity-70 font-mono mt-0.5">{item.relPath}</div>
            </div>
        </div>
      );
  };

  const ColumnHeader = ({ title, icon: Icon, count, colorClass, selectAllItems }: any) => (
      <div className={`flex flex-col p-4 border-b border-white/10 bg-slate-900/80 sticky top-0 z-20 backdrop-blur-xl`}>
          <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded bg-${colorClass}-500/10 text-${colorClass}-400`}>
                      <Icon size={16} />
                  </div>
                  <h3 className={`font-bold text-sm uppercase tracking-wider text-${colorClass}-400`}>{title}</h3>
              </div>
              <span className="text-xs text-slate-600 font-mono bg-black/30 px-2 py-0.5 rounded-full">{count}</span>
          </div>
          {selectAllItems && (
              <button 
                  onClick={(e) => selectGroup(selectAllItems, e)}
                  className={`text-[10px] py-1 px-2 rounded border border-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all uppercase tracking-tighter font-bold`}
              >
                  Select All
              </button>
          )}
      </div>
  );

  const VisualsContent = () => (
      <div className="flex-1 flex flex-col min-h-0 min-w-0 h-full">
          <ColumnHeader title="Visuals" icon={ImageIcon} count={catalog.visuals.length} colorClass="indigo" selectAllItems={catalog.visuals} />
          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scroll bg-black/20">
              {catalog.visuals.map(item => <ItemRow key={item.id} item={item} colorClass="indigo" />)}
          </div>
      </div>
  );

  const AmbientContent = () => (
      <div className="flex-1 flex flex-col min-h-0 min-w-0 h-full">
          <ColumnHeader title="Ambient" icon={Grid} count={catalog.ambient.length} colorClass="emerald" selectAllItems={catalog.ambient} />
          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scroll bg-black/20">
              {catalog.ambient.map(item => <ItemRow key={item.id} item={item} colorClass="emerald" />)}
          </div>
      </div>
  );

  const MusicContent = () => (
      <div className="flex-1 flex flex-col min-h-0 min-w-0 h-full">
          <ColumnHeader title="Music" icon={List} count={catalog.music.length} colorClass="pink" />
          <div className="flex-1 overflow-y-auto p-3 custom-scroll bg-black/20">
              {Object.entries(catalog.musicGroups).map(([groupName, items]) => {
                  const groupItems = items as MediaFile[];
                  const isExpanded = expandedMusicGroups[groupName];
                  return (
                      <div key={groupName} className="mb-2 border border-white/5 rounded-lg overflow-hidden bg-slate-900/20 w-full transition-all hover:bg-slate-900/30">
                          <div onClick={() => toggleMusicGroup(groupName)} className="flex items-center justify-between p-3 cursor-pointer select-none">
                              <div className="flex items-center gap-2 overflow-hidden min-w-0">
                                  <Folder size={14} className={`shrink-0 ${isExpanded ? 'text-pink-400' : 'text-slate-600'}`} />
                                  <span className={`text-xs font-bold uppercase tracking-wider truncate ${isExpanded ? 'text-slate-100' : 'text-slate-400'}`}>
                                      {groupName}
                                  </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-[10px] text-slate-500 bg-black/40 px-1.5 py-0.5 rounded-full">{groupItems.length}</span>
                                  {isExpanded ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
                              </div>
                          </div>
                          {isExpanded && (
                              <div className="p-2 space-y-2 border-t border-white/5 bg-black/40">
                                  <div className="flex justify-end px-1">
                                      <button onClick={(e) => selectGroup(groupItems, e)} className="text-[9px] text-pink-500 hover:text-pink-400 uppercase font-bold tracking-widest">Select Group</button>
                                  </div>
                                  {groupItems.map(item => <ItemRow key={item.id} item={item} colorClass="pink" />)}
                              </div>
                          )}
                      </div>
                  );
              })}
          </div>
      </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 sm:p-6">
        <div className="w-full max-w-7xl h-[92vh] bg-slate-950 border border-white/10 rounded-3xl flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden">
            
            <div className="p-5 bg-slate-900/80 border-b border-white/10 flex items-center justify-between shrink-0 z-30">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 border border-indigo-500/20">
                        <LayoutGrid size={22} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Media Library</h2>
                        <p className="text-xs text-slate-500 font-medium">Select tracks and visuals to start mixing</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors">Close</button>
                    <button 
                        onClick={handleImport}
                        className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Import <span className="bg-white/20 px-2 py-0.5 rounded-full text-[11px] font-mono">{selectedIds.size}</span>
                    </button>
                </div>
            </div>

            <div className="flex lg:hidden border-b border-white/5 bg-slate-900/30">
                <button onClick={() => setActiveTab('visuals')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'visuals' ? 'text-indigo-400 bg-indigo-500/10 border-b-2 border-indigo-500' : 'text-slate-500 hover:bg-white/5'}`}>Visuals</button>
                <button onClick={() => setActiveTab('ambient')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'ambient' ? 'text-emerald-400 bg-emerald-500/10 border-b-2 border-emerald-500' : 'text-slate-500 hover:bg-white/5'}`}>Ambient</button>
                <button onClick={() => setActiveTab('music')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'music' ? 'text-pink-400 bg-pink-500/10 border-b-2 border-pink-500' : 'text-slate-500 hover:bg-white/5'}`}>Music</button>
            </div>

            <div className="flex-1 overflow-hidden relative">
                <div className="hidden lg:flex flex-row h-full divide-x divide-white/10">
                    <VisualsContent />
                    <AmbientContent />
                    <MusicContent />
                </div>
                <div className="lg:hidden h-full">
                    {activeTab === 'visuals' && <VisualsContent />}
                    {activeTab === 'ambient' && <AmbientContent />}
                    {activeTab === 'music' && <MusicContent />}
                </div>
            </div>
        </div>
    </div>
  );
};