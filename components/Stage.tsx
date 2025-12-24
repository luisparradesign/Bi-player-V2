import React, { useEffect, useRef } from 'react';
import { usePlayer } from '../context/PlayerContext';

export const Stage: React.FC = () => {
  const { deckItems, activeStageId, panelsHidden } = usePlayer();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const activeItem = deckItems.find(i => i.deckId === activeStageId);

  useEffect(() => {
    if (videoRef.current && activeItem) {
        videoRef.current.src = activeItem.url;
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
            playPromise.catch(e => console.log("Stage autoplay prevented or interrupted", e));
        }
    } else if (videoRef.current && !activeItem) {
        videoRef.current.pause();
        videoRef.current.src = "";
    }
  }, [activeItem]); 

  return (
    <div className="w-full h-full bg-black relative flex items-center justify-center overflow-hidden">
      {/* CRT/Screen Border Effect (Optional, subtle) */}
      <div className="absolute inset-0 pointer-events-none z-10 shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]"></div>
      
      {activeItem ? (
        <video 
            ref={videoRef}
            className="w-full h-full object-cover"
            loop
            playsInline
            muted={true}
        />
      ) : (
        // Empty State Placeholder
        <div className="w-full h-full flex flex-col items-center justify-center text-slate-800 bg-transparent">
            {/* Transparent bg allows global app bg to show through if desired, or keep black */}
            <div className="relative opacity-50">
                <div className="w-32 h-32 border border-slate-800 rounded-full flex items-center justify-center">
                    <div className="w-24 h-24 border border-slate-800/50 rounded-full flex items-center justify-center">
                         <div className="w-2 h-2 bg-indigo-500/50 rounded-full"></div>
                    </div>
                </div>
            </div>
        </div>
      )}
      
      {/* HUD Info - Positioned slightly higher to clear the Deck if visible */}
      {activeItem && !panelsHidden && (
          <div className="absolute bottom-[230px] left-4 z-20 bg-black/50 backdrop-blur px-3 py-1 rounded border border-white/10 text-[10px] font-mono text-white/70 transition-all duration-500">
              <span className="text-indigo-400 mr-2">LIVE</span>
              {activeItem.name}
          </div>
      )}
       {/* HUD Info - Moves to bottom corner if panels are hidden */}
       {activeItem && panelsHidden && (
          <div className="absolute bottom-4 left-4 z-20 bg-black/50 backdrop-blur px-3 py-1 rounded border border-white/10 text-[10px] font-mono text-white/70 transition-all duration-500">
              <span className="text-indigo-400 mr-2">LIVE</span>
              {activeItem.name}
          </div>
      )}
    </div>
  );
};