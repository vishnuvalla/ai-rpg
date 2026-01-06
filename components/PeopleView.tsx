import React, { useState } from 'react';
import { Npc } from '../types';
import { Users, User, MapPin, Activity, HeartHandshake } from 'lucide-react';

interface Props {
  npcs: Npc[];
}

const PeopleView: React.FC<Props> = ({ npcs }) => {
  const [selectedNpc, setSelectedNpc] = useState<Npc | null>(null);

  const getDispositionColor = (disp: string) => {
      const d = disp.toLowerCase();
      if (d.includes('hostile') || d.includes('enemy')) return 'text-term-red border-term-red';
      if (d.includes('friendly') || d.includes('ally') || d.includes('indebted')) return 'text-term-highlight border-term-highlight';
      return 'text-term-main border-term-main'; // Neutral/Wary/Unknown
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'Deceased': return 'text-term-red opacity-50 line-through';
          case 'Missing': return 'text-term-cyan';
          case 'Unknown': return 'text-term-gray';
          default: return 'text-term-text';
      }
  };

  return (
    <div className="flex flex-col h-full p-4 md:p-8 relative">
      <h2 className="text-3xl text-term-main mb-6 uppercase border-b border-term-gray pb-2 tracking-widest text-shadow flex items-center gap-3">
        <Users className="w-8 h-8" /> > PERSONNEL_DOSSIER
      </h2>
      
      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-32">
        {npcs.map(npc => (
          <div 
            key={npc.id} 
            onClick={() => setSelectedNpc(npc)}
            className="bg-term-dark p-5 border border-term-gray hover:border-term-main transition-colors group relative cursor-pointer flex flex-col gap-2"
          >
             {/* Disposition Badge */}
             <div className={`absolute top-4 right-4 text-[10px] uppercase border px-2 py-0.5 font-bold tracking-wider ${getDispositionColor(npc.disposition)}`}>
                 {npc.disposition}
             </div>

            <div className="flex items-center gap-3 mb-2">
                <div className="bg-term-gray/20 p-2 rounded-full">
                    <User className="w-6 h-6 text-term-text" />
                </div>
                <div>
                     <h3 className={`text-xl font-bold uppercase tracking-wide truncate pr-16 ${getStatusColor(npc.status)}`}>{npc.name}</h3>
                     <div className="text-xs text-term-gray uppercase">{npc.role}</div>
                </div>
            </div>

            <div className="text-sm text-term-text/80 leading-relaxed font-mono line-clamp-3 mb-2">
              {npc.description}
            </div>

            <div className="mt-auto pt-3 border-t border-term-gray/30 text-xs font-mono flex items-center gap-2 text-term-cyan">
                <MapPin className="w-3 h-3" />
                {npc.location}
            </div>
          </div>
        ))}
        {npcs.length === 0 && (
          <p className="text-term-gray col-span-full text-center py-10 uppercase text-xl">>> NO RECORDS FOUND</p>
        )}
      </div>

      {/* Detail Modal */}
      {selectedNpc && (
        <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
             <div className="bg-term-dark border-2 border-term-main max-w-2xl w-full max-h-[80vh] flex flex-col relative shadow-[0_0_30px_rgba(215,153,33,0.2)]">
                <div className="p-6 border-b border-term-gray bg-term-gray/10 flex justify-between items-start">
                    <div>
                         <h2 className="text-3xl font-bold text-term-text uppercase tracking-widest mb-1">{selectedNpc.name}</h2>
                         <div className="text-term-main uppercase text-sm font-bold tracking-wider">{selectedNpc.role}</div>
                    </div>
                    <button onClick={() => setSelectedNpc(null)} className="text-term-gray hover:text-white uppercase text-xs border border-term-gray px-2 py-1">
                        [CLOSE]
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-term-bg p-3 border border-term-gray/50">
                            <div className="text-xs text-term-gray uppercase mb-1 flex items-center gap-1"><HeartHandshake className="w-3 h-3"/> Disposition</div>
                            <div className={`text-lg font-bold uppercase ${getDispositionColor(selectedNpc.disposition)}`}>{selectedNpc.disposition}</div>
                        </div>
                         <div className="bg-term-bg p-3 border border-term-gray/50">
                            <div className="text-xs text-term-gray uppercase mb-1 flex items-center gap-1"><Activity className="w-3 h-3"/> Status</div>
                            <div className={`text-lg font-bold uppercase ${getStatusColor(selectedNpc.status)}`}>{selectedNpc.status}</div>
                        </div>
                    </div>
                    
                    <div>
                        <div className="text-xs text-term-gray uppercase mb-2 border-b border-term-gray/30 pb-1">Notes & Description</div>
                        <p className="text-term-text leading-relaxed whitespace-pre-wrap">{selectedNpc.description}</p>
                    </div>

                    <div className="bg-term-gray/10 p-4 border-l-2 border-term-cyan">
                        <div className="text-xs text-term-cyan uppercase mb-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> Last Known Location / Route
                        </div>
                        <div className="text-term-text">{selectedNpc.location}</div>
                    </div>
                </div>
             </div>
        </div>
      )}
    </div>
  );
};

export default PeopleView;