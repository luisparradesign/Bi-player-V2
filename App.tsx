import React, { useState, useRef } from 'react';
import { PlayerProvider, usePlayer } from './context/PlayerContext';
import { Stage } from './components/Stage';
import { Deck } from './components/Deck';
import { TopBar, FloatingControls } from './components/TopBar';
import { Selector } from './components/Selector';
import { processFiles } from './utils/fileHelpers';
import { Catalog } from './types';

const MainLayout = () => {
  const { catalog, setCatalog, activeBgId, deckItems } = usePlayer();
  const [showSelector, setShowSelector] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Background handling
  const activeBgItem = deckItems.find(i => i.deckId === activeBgId);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        const filesArray = Array.from(e.target.files) as File[];
        const newCatalog = processFiles(filesArray);
        setCatalog(newCatalog);
        setShowSelector(true);
    }
  };

  const openFilePicker = () => {
    if (fileInputRef.current) {
        fileInputRef.current.click();
    }
  };

  return (
    <>
      {/* Global Background Layer (Fallback if Stage is empty or for ambiance) */}
      <div className="fixed inset-0 z-0 bg-slate-950 pointer-events-none">
        {activeBgItem && activeBgItem.type === 'video' && (
             <video 
                src={activeBgItem.url} 
                autoPlay 
                loop 
                muted 
                className="w-full h-full object-cover opacity-30 blur-sm scale-105"
            />
        )}
        <div className="absolute inset-0 bg-slate-950/80"></div>
      </div>

      <div className="relative z-10 w-full h-screen max-h-screen overflow-hidden text-slate-200">
        
        {/* LAYER 1: The Stage (Full Screen Video) */}
        <div className="absolute inset-0 z-10">
            <Stage />
        </div>

        {/* LAYER 2: Top Bar (Overlay) */}
        <div className="absolute top-0 left-0 right-0 z-30">
             <TopBar 
                onOpenSelector={() => setShowSelector(true)} 
                onSelectRoot={openFilePicker} 
            />
        </div>

        {/* LAYER 3: The Mixer Rack (Overlay Bottom) */}
        <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
             {/* Deck handles its own pointer-events-auto for children */}
             <div className="pointer-events-auto">
                <Deck />
             </div>
        </div>

        {/* Hidden Input */}
        <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            // @ts-ignore
            webkitdirectory=""
            directory=""
            multiple
            onChange={handleFileSelect}
        />
      </div>

      {showSelector && <Selector onClose={() => setShowSelector(false)} />}
      <FloatingControls />
    </>
  );
};

const App = () => {
  return (
    <PlayerProvider>
      <MainLayout />
    </PlayerProvider>
  );
};

export default App;