import React, { useRef, useEffect, useState } from 'react';
import { LocationNode, GameState } from '../types';
import { MapPin, Navigation, Castle, Trees, Mountain, Home, Locate, Tent, Landmark } from 'lucide-react';

interface Props {
  locations: LocationNode[];
  gameState: Partial<GameState>;
}

const MapView: React.FC<Props> = ({ locations, gameState }) => {
  const [scale, setScale] = useState(0.5); // Pixels per mile
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Player is always treated as 0,0 for visual centering in this simple version,
  // or we assume locations are relative to 0,0 which is the "center of the known world".
  // For a "Middle Earth" feel, we plot them on a large canvas.

  const getIcon = (type: string) => {
    switch (type) {
      case 'City': return <Castle className="w-5 h-5" />;
      case 'Forest': return <Trees className="w-5 h-5" />;
      case 'Dungeon': return <Mountain className="w-5 h-5" />;
      case 'Village': return <Home className="w-5 h-5" />;
      case 'Ruins': return <Locate className="w-5 h-5" />;
      case 'Landmark': return <Landmark className="w-5 h-5" />;
      default: return <MapPin className="w-5 h-5" />;
    }
  };

  const getColor = (type: string) => {
      switch (type) {
          case 'City': return 'text-term-main';
          case 'Dungeon': return 'text-term-red';
          case 'Forest': return 'text-term-highlight';
          case 'Village': return 'text-term-cyan';
          default: return 'text-term-gray';
      }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-term-gray/30 bg-term-dark flex justify-between items-center z-10 shrink-0">
        <div>
            <h2 className="text-xl text-term-main flex items-center gap-2 uppercase tracking-widest">
                <Navigation className="w-5 h-5" /> >> VECTOR_GRID
            </h2>
            <div className="text-xs font-mono text-term-gray mt-1">
                SECTOR: {gameState.worldName || 'UNKNOWN'} | SCALE: 1:{Math.round(1/scale)}
            </div>
        </div>
        <div className="flex gap-2">
            <button onClick={() => setScale(s => Math.max(0.1, s - 0.1))} className="border border-term-gray px-3 py-1 text-term-text hover:bg-term-gray/20">-</button>
            <button onClick={() => setScale(s => Math.min(2, s + 0.1))} className="border border-term-gray px-3 py-1 text-term-text hover:bg-term-gray/20">+</button>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden bg-black" ref={containerRef}>
        {/* Grid Lines */}
        <div 
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
                backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)',
                backgroundSize: '40px 40px',
                backgroundPosition: 'center center'
            }}
        />
        
        {/* Center Crosshair (0,0) */}
        <div className="absolute top-1/2 left-1/2 w-full h-[1px] bg-term-main/20 -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute top-1/2 left-1/2 h-full w-[1px] bg-term-main/20 -translate-x-1/2 -translate-y-1/2" />
        
        {/* Player Position (Assumed 0,0 for now or center of map) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <div className="w-3 h-3 bg-term-main rounded-full animate-pulse shadow-[0_0_10px_#d79921]" />
            <div className="text-[10px] text-term-main absolute top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">YOU</div>
        </div>

        {/* Locations */}
        {locations.map((loc, idx) => {
            // Transform coordinates to CSS positioning
            // Center is 50%, 50%.
            // +X is right, -X is left. +Y is up (in map terms) or down (in CSS terms)?
            // Usually maps: +Y is North (Up). CSS: +Y is Down. So we invert Y.
            if (!loc.coordinates) return null;
            
            const left = `calc(50% + ${loc.coordinates.x * scale}px)`;
            const top = `calc(50% - ${loc.coordinates.y * scale}px)`;

            return (
                <div 
                    key={idx} 
                    className={`absolute group cursor-pointer transition-all hover:z-50 ${getColor(loc.type)}`}
                    style={{ left, top, transform: 'translate(-50%, -50%)' }}
                >
                    <div className="hover:scale-125 transition-transform p-1">
                        {getIcon(loc.type)}
                    </div>
                    
                    {/* Tooltip */}
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-term-dark border border-term-gray p-2 w-48 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
                        <div className="text-xs font-bold text-term-main uppercase mb-1">{loc.name}</div>
                        <div className="text-[10px] text-term-gray uppercase mb-1">
                            COORD: {loc.coordinates.x}, {loc.coordinates.y}
                        </div>
                        <div className="text-[10px] text-term-text leading-tight">
                            {loc.description}
                        </div>
                    </div>
                </div>
            );
        })}
      </div>
      
      {/* Footer Info */}
      <div className="p-2 bg-term-dark border-t border-term-gray/30 text-[10px] text-term-gray font-mono flex justify-between">
         <span>GRID_UNIT: MILE</span>
         <span>RADAR_SWEEP: ACTIVE</span>
      </div>
    </div>
  );
};

export default MapView;