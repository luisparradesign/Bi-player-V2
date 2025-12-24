import React, { useRef, useState, useCallback } from 'react';

interface SliderProps {
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
  vertical?: boolean;
  className?: string;
  trackColorStart?: string;
  trackColorEnd?: string;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  min,
  max,
  onChange,
  vertical = false,
  className = '',
  trackColorStart = '#22c55e',
  trackColorEnd = '#16a34a'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Calculate percentage
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  const handleInteraction = useCallback((clientY: number, clientX: number) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    let newValue: number;

    if (vertical) {
      // 0 at bottom
      const relativeY = clientY - rect.top;
      const height = rect.height;
      const ratio = 1 - (relativeY / height); 
      newValue = min + ratio * (max - min);
    } else {
      // 0 at left
      const relativeX = clientX - rect.left;
      const width = rect.width;
      const ratio = relativeX / width;
      newValue = min + ratio * (max - min);
    }

    newValue = Math.max(min, Math.min(max, newValue));
    onChange(newValue);
  }, [min, max, onChange, vertical]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault(); 
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    handleInteraction(e.clientY, e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    handleInteraction(e.clientY, e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <div 
      className={`relative flex items-center justify-center touch-none select-none cursor-pointer group ${className}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      // Hit area remains accessible
      style={{
          padding: vertical ? '0 10px' : '10px 0'
      }}
    >
        {/* Track Background */}
        <div 
            ref={containerRef}
            className={`bg-slate-800/50 backdrop-blur-sm rounded-full relative overflow-hidden transition-all duration-300 group-hover:bg-slate-800 ${vertical ? 'w-1.5 h-full' : 'w-full h-1.5'}`}
        >
            {/* Active Fill with Glow */}
            <div 
                className="absolute rounded-full pointer-events-none transition-all duration-100 ease-out shadow-[0_0_10px_currentColor]"
                style={{
                    color: trackColorStart,
                    background: `linear-gradient(${vertical ? 'to top' : 'to right'}, ${trackColorStart}, ${trackColorEnd})`,
                    ...(vertical 
                        ? { bottom: 0, left: 0, right: 0, height: `${percentage}%` } 
                        : { left: 0, top: 0, bottom: 0, width: `${percentage}%` }
                    )
                }}
            />
        </div>

        {/* Thumb - Only visible on hover/drag to keep UI clean */}
        <div 
            className={`absolute pointer-events-none transition-all duration-200 ease-out ${isDragging || 'opacity-0 group-hover:opacity-100'}`}
            style={{
                ...(vertical 
                    ? { bottom: `${percentage}%`, left: '50%', transform: 'translate(-50%, 50%)' } 
                    : { left: `${percentage}%`, top: '50%', transform: 'translate(-50%, -50%)' }
                )
            }}
        >
            <div 
                className={`rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] border-2 border-slate-900 ${vertical ? 'w-3 h-3' : 'w-3 h-3'}`}
            ></div>
        </div>
    </div>
  );
};