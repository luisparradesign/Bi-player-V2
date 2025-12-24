import React, { useRef, useState, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { DeckItem, Category } from '../types';
import { Play, Pause, X, Monitor, RotateCcw, Sparkles } from 'lucide-react';
import { Slider } from './Slider';
import { generateThumbnail, generateAIThumbnail } from '../utils/fileHelpers';

interface MediaCardProps {
  item: DeckItem;
  collapsed?: boolean;
}

export const MediaCard: React.FC<MediaCardProps> = ({ item, collapsed = false }) => {
  const { 
    masterVolume, removeFromDeck, 
    activeStageId, setActiveStageId, 
    globalPlayTrigger, globalPauseTrigger, globalStopTrigger, globalMute,
  } = usePlayer();

  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0); 
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const [generatedThumb, setGeneratedThumb] = useState<string | null>(null);
  const [aiThumb, setAiThumb] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const isVisual = item.category === Category.Visual;
  const isActiveStage = activeStageId === item.deckId;

  const colors = {
    [Category.Ambient]: { start: '#34d399', end: '#059669', text: 'text-emerald-400', glow: 'shadow-emerald-500/20' },
    [Category.Visual]:  { start: '#818cf8', end: '#4f46e5', text: 'text-indigo-400', glow: 'shadow-indigo-500/20' },
    [Category.Music]:   { start: '#f472b6', end: '#db2777', text: 'text-pink-400', glow: 'shadow-pink-500/20' }
  };
  const theme = colors[item.category];

  // Global triggers
  useEffect(() => {
    if (mediaRef.current && !isPlaying && globalPlayTrigger > 0) {
        mediaRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [globalPlayTrigger]);

  useEffect(() => {
    if (mediaRef.current && globalPauseTrigger > 0) { mediaRef.current.pause(); setIsPlaying(false); }
  }, [globalPauseTrigger]);

  useEffect(() => {
    if (mediaRef.current && globalStopTrigger > 0) { 
        mediaRef.current.pause(); 
        mediaRef.current.currentTime = 0; 
        setIsPlaying(false); 
    }
  }, [globalStopTrigger]);

  // Volume & Mute Logic
  useEffect(() => {
    if (mediaRef.current) {
      if (isVisual) {
          mediaRef.current.muted = true;
          mediaRef.current.volume = 0;
      } else {
        const effVol = volume / 100;
        const expVol = effVol * effVol;
        mediaRef.current.volume = expVol * masterVolume;
        mediaRef.current.muted = globalMute;
      }
    }
  }, [volume, masterVolume, globalMute, isVisual]);

  // Thumbnail Logic with Global Cache
  useEffect(() => {
    const initThumbs = async () => {
        if (item.thumbUrl) return;

        if (item.type === 'video') {
            const videoT = await generateThumbnail(item.url);
            if (videoT) {
                setGeneratedThumb(videoT);
                return;
            }
        }

        // Use AI generation (which has internal caching)
        setIsGenerating(true);
        const aiT = await generateAIThumbnail(item.name);
        if (aiT) setAiThumb(aiT);
        setIsGenerating(false);
    };

    initThumbs();
  }, [item]);

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!mediaRef.current) return;
    if (isPlaying) {
      mediaRef.current.pause();
      setIsPlaying(false);
    } else {
      mediaRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const handleSeek = (val: number) => {
      if (mediaRef.current) {
          mediaRef.current.currentTime = val;
          setProgress(val);
      }
  }

  const handleTimeUpdate = () => {
    if (mediaRef.current) {
      setProgress(mediaRef.current.currentTime);
      if (!duration && mediaRef.current.duration) setDuration(mediaRef.current.duration);
    }
  };

  const handleStageToggle = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (item.type !== 'video') return;
    if (isActiveStage) {
        setActiveStageId(null);
    } else { 
        setActiveStageId(item.deckId); 
        if (mediaRef.current && !isPlaying) {
             mediaRef.current.play().catch(()=>{}); 
             setIsPlaying(true); 
        }
    }
  };

  const containerClass = collapsed 
    ? 'w-[48px] h-[200px]' 
    : 'w-[100px] h-[200px] md:w-[120px] md:h-[200px]';

  const displayThumb = item.thumbUrl || generatedThumb || aiThumb;

  return (
    <div 
        className={`group relative flex flex-col rounded-xl overflow-hidden select-none bg-slate-900/40 backdrop-blur-xl border border-white/5 transition-all duration-300 shadow-2xl ${containerClass}
        ${isPlaying ? `ring-1 ring-white/20 ${theme.glow} shadow-lg` : 'hover:bg-slate-800/40'}`}
    >
        {/* Background Art - Square coherent scaling */}
        <div 
            className={`absolute inset-0 z-0 bg-cover bg-center transition-all duration-700 group-hover:scale-110 opacity-40 group-hover:opacity-60 grayscale group-hover:grayscale-0
            ${isGenerating ? 'animate-pulse bg-slate-800' : ''}`}
            style={{ backgroundImage: displayThumb ? `url(${displayThumb})` : undefined }}
        />
        
        {isGenerating && (
            <div className="absolute inset-0 flex items-center justify-center z-10 opacity-50">
                <Sparkles size={16} className="text-indigo-400 animate-spin" />
            </div>
        )}

        <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-950/90 via-slate-950/40 to-slate-950/95"></div>

        {item.type === 'video' ? (
            <video ref={mediaRef as React.RefObject<HTMLVideoElement>} src={item.url} loop playsInline muted={true} onTimeUpdate={handleTimeUpdate} className="hidden" />
        ) : (
            <audio ref={mediaRef as React.RefObject<HTMLAudioElement>} src={item.url} loop onTimeUpdate={handleTimeUpdate} />
        )}

        {/* Header */}
        <div className="relative z-20 flex justify-between items-start p-2 w-full">
             <div className="flex-1 min-w-0 pr-1">
                 {!collapsed && (
                    <h3 className="text-[9px] font-bold text-slate-100 leading-tight truncate drop-shadow-lg uppercase tracking-tight">
                        {item.name}
                    </h3>
                 )}
             </div>
             <button onClick={() => removeFromDeck(item.deckId)} className="text-slate-500 hover:text-red-400 transition-colors p-0.5">
                 <X size={10} />
             </button>
        </div>

        {/* Control Area */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center py-1 w-full">
             {isVisual ? (
                 <button 
                    onClick={handleStageToggle}
                    className={`relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 border border-white/10 shadow-lg
                    ${isActiveStage ? 'bg-indigo-600 text-white shadow-indigo-500/50 scale-105' : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700'}`}
                 >
                     <Monitor size={20} />
                     {isActiveStage && (
                         <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-300 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                        </span>
                     )}
                 </button>
             ) : (
                 <div className="h-full w-full px-4 py-1 relative group/slider">
                     <Slider 
                        vertical min={0} max={100} value={volume} onChange={setVolume}
                        trackColorStart={theme.start} trackColorEnd={theme.end}
                        className="h-full w-full"
                     />
                     {!collapsed && (
                         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-mono font-black text-white opacity-0 group-hover/slider:opacity-100 pointer-events-none drop-shadow-xl transition-opacity">
                             {Math.round(volume)}%
                         </div>
                     )}
                 </div>
             )}
        </div>

        {/* Footer */}
        <div className="relative z-20 p-2 flex flex-col gap-2 w-full bg-black/40 border-t border-white/5 backdrop-blur-md">
            {!isVisual && !collapsed && (
                <div className="w-full h-1 bg-slate-800/50 rounded-full overflow-hidden cursor-pointer hover:h-1.5 transition-all" onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pos = (e.clientX - rect.left) / rect.width;
                    handleSeek(pos * (duration || 1));
                }}>
                    <div className={`h-full bg-${theme.start} transition-all`} style={{ width: `${(progress / (duration || 1)) * 100}%`, backgroundColor: theme.start }}></div>
                </div>
            )}

            <div className="flex items-center justify-between gap-1">
                <button 
                    onClick={togglePlay}
                    className={`flex-1 h-7 rounded-lg flex items-center justify-center transition-all shadow-md
                    ${isPlaying 
                        ? `bg-gradient-to-r from-${theme.start} to-${theme.end} text-white border border-white/10` 
                        : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'}`}
                >
                    {isPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                </button>

                {!collapsed && (
                    <button onClick={() => handleSeek(0)} className="w-7 h-7 rounded-lg bg-slate-800/80 text-slate-500 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors">
                        <RotateCcw size={10} />
                    </button>
                )}
            </div>
        </div>
    </div>
  );
};