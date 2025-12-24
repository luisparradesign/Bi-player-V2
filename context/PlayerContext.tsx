import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Catalog, DeckItem, MediaFile, SlimState } from '../types';

interface PlayerContextType {
  masterVolume: number;
  setMasterVolume: (val: number) => void;
  
  catalog: Catalog | null;
  setCatalog: (c: Catalog) => void;
  
  deckItems: DeckItem[];
  addToDeck: (items: MediaFile[]) => void;
  removeFromDeck: (deckId: string) => void;
  
  activeStageId: string | null;
  setActiveStageId: (id: string | null) => void;
  
  activeBgId: string | null;
  setActiveBgId: (id: string | null) => void;

  globalPlayTrigger: number;
  playAll: () => void;
  globalPauseTrigger: number;
  pauseAll: () => void;
  globalStopTrigger: number;
  stopAll: () => void;
  globalMute: boolean;
  setGlobalMute: (m: boolean) => void;

  slimState: SlimState;
  toggleSlim: (key: keyof SlimState) => void;
  
  panelsHidden: boolean;
  togglePanels: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [masterVolume, setMasterVolume] = useState(1);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [deckItems, setDeckItems] = useState<DeckItem[]>([]);
  const [activeStageId, setActiveStageId] = useState<string | null>(null);
  const [activeBgId, setActiveBgId] = useState<string | null>(null);
  const [panelsHidden, setPanelsHidden] = useState(false);
  
  const [globalPlayTrigger, setGlobalPlayTrigger] = useState(0);
  const [globalPauseTrigger, setGlobalPauseTrigger] = useState(0);
  const [globalStopTrigger, setGlobalStopTrigger] = useState(0);
  const [globalMute, setGlobalMute] = useState(false);

  const [slimState, setSlimState] = useState<SlimState>({
    all: false,
    ambient: false,
    music: false,
    visual: false,
  });

  const playAll = () => setGlobalPlayTrigger(p => p + 1);
  const pauseAll = () => setGlobalPauseTrigger(p => p + 1);
  const stopAll = () => setGlobalStopTrigger(p => p + 1);
  const togglePanels = () => setPanelsHidden(prev => !prev);

  const toggleSlim = (key: keyof SlimState) => {
    setSlimState(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const addToDeck = async (items: MediaFile[]) => {
    // Generate deck items with unique IDs to allow duplicates if desired, 
    // though usually we filter them. Here we filter existing by original ID to avoid dupes on deck
    const currentIds = new Set(deckItems.map(d => d.id));
    const newItems: DeckItem[] = [];

    for (const item of items) {
      if (!currentIds.has(item.id)) {
        let thumbUrl: string | undefined = undefined;
        // Try to find a matching thumbnail image from catalog
        if (catalog) {
           const key = item.relPath.replace(/\.[^.]+$/, '');
           const thumbFile = catalog.thumbnails[key];
           if (thumbFile) {
             thumbUrl = URL.createObjectURL(thumbFile);
           }
        }
        
        newItems.push({
          ...item,
          deckId: `deck_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          thumbUrl
        });
      }
    }
    setDeckItems(prev => [...prev, ...newItems]);
  };

  const removeFromDeck = (deckId: string) => {
    setDeckItems(prev => prev.filter(i => i.deckId !== deckId));
    if (activeStageId === deckId) setActiveStageId(null);
    if (activeBgId === deckId) setActiveBgId(null);
  };

  // Keyboard shortcut for hiding panels
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'h' && e.target instanceof HTMLElement && e.target.tagName !== 'INPUT') {
        togglePanels();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <PlayerContext.Provider value={{
      masterVolume, setMasterVolume,
      catalog, setCatalog,
      deckItems, addToDeck, removeFromDeck,
      activeStageId, setActiveStageId,
      activeBgId, setActiveBgId,
      globalPlayTrigger, playAll,
      globalPauseTrigger, pauseAll,
      globalStopTrigger, stopAll,
      globalMute, setGlobalMute,
      slimState, toggleSlim,
      panelsHidden, togglePanels
    }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within PlayerProvider');
  return context;
};