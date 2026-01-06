import React, { useState } from 'react';
import { LoreEntry } from '../types';
import { Book, Shield, MapPin, Skull, Zap, Users, X, Database } from 'lucide-react';

interface Props {
  entries: LoreEntry[];
}

const JournalView: React.FC<Props> = ({ entries }) => {
  const [filter, setFilter] = useState<string>('All');
  const [selectedEntry, setSelectedEntry] = useState<LoreEntry | null>(null);

  const categories = [
    { name: 'All', icon: <Book className="w-5 h-5" /> },
    { name: 'Gods & Magic', type: 'God', icon: <Zap className="w-5 h-5" /> },
    { name: 'Factions', type: 'Faction', icon: <Shield className="w-5 h-5" /> },
    { name: 'Locations', type: 'Location', icon: <MapPin className="w-5 h-5" /> },
    { name: 'Races', type: 'Race', icon: <Users className="w-5 h-5" /> },
    { name: 'Creatures', type: 'Creature', icon: <Skull className="w-5 h-5" /> },
  ];

  const filteredEntries = filter === 'All' 
    ? entries 
    : entries.filter(e => e.type === categories.find(c => c.name === filter)?.type);

  return (
    <div className="flex flex-col h-full p-4 md:p-8 relative">
      <h2 className="text-3xl text-term-main mb-6 uppercase border-b border-term-gray pb-2 tracking-widest text-shadow">
        > DATA_ARCHIVES
      </h2>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        {categories.map(cat => (
          <button
            key={cat.name}
            onClick={() => setFilter(cat.name)}
            className={`flex items-center gap-2 px-4 py-2 text-lg uppercase border transition-all ${
              filter === cat.name 
                ? 'bg-term-main text-black border-term-main font-bold shadow-[0_0_10px_rgba(215,153,33,0.3)]' 
                : 'bg-transparent text-term-gray border-term-gray hover:text-term-main hover:border-term-main'
            }`}
          >
            {cat.icon}
            {cat.name}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-32">
        {filteredEntries.map(entry => (
          <div 
            key={entry.id} 
            onClick={() => setSelectedEntry(entry)}
            className="bg-term-dark p-5 border border-term-gray hover:border-term-main transition-colors group relative cursor-pointer hover:bg-term-gray/10"
          >
             {/* Corner Accents */}
             <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-term-gray group-hover:border-term-main transition-colors"></div>
             <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-term-gray group-hover:border-term-main transition-colors"></div>
             <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-term-gray group-hover:border-term-main transition-colors"></div>
             <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-term-gray group-hover:border-term-main transition-colors"></div>

            <div className="flex justify-between items-start mb-3 border-b border-dashed border-term-gray pb-2 group-hover:border-term-main">
              <h3 className="text-xl font-bold text-term-text uppercase tracking-wide truncate pr-2 group-hover:text-term-main">{entry.title}</h3>
              <span className="text-xs uppercase text-term-main border border-term-main px-1 mt-1 shrink-0">
                {entry.type}
              </span>
            </div>
            <p className="text-lg text-term-text/80 leading-relaxed font-mono line-clamp-3">
              {entry.description}
            </p>
            <div className="mt-4 text-xs text-term-gray uppercase group-hover:text-term-main flex items-center gap-1">
                <Database className="w-3 h-3" /> Click to Decrypt
            </div>
          </div>
        ))}
        {filteredEntries.length === 0 && (
          <p className="text-term-gray col-span-full text-center py-10 uppercase text-xl">>> NO ENTRIES FOUND</p>
        )}
      </div>

      {/* Modal / Detail View */}
      {selectedEntry && (
        <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
            <div className="bg-term-dark border-2 border-term-main max-w-4xl w-full max-h-[80vh] flex flex-col relative shadow-[0_0_30px_rgba(215,153,33,0.2)]">
                
                {/* Modal Header */}
                <div className="flex justify-between items-center p-6 border-b border-term-gray bg-term-gray/10">
                    <div className="flex items-center gap-3">
                        <Database className="w-6 h-6 text-term-main animate-pulse" />
                        <h2 className="text-3xl font-bold text-term-text uppercase tracking-widest">{selectedEntry.title}</h2>
                    </div>
                    <button 
                        onClick={() => setSelectedEntry(null)}
                        className="text-term-main hover:text-white transition-colors"
                    >
                        <X className="w-8 h-8" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-8 overflow-y-auto flex-1">
                    <div className="flex gap-4 mb-6">
                        <span className="border border-term-main text-term-main px-2 py-1 uppercase text-sm font-bold">
                            TYPE: {selectedEntry.type}
                        </span>
                        <span className="border border-term-cyan text-term-cyan px-2 py-1 uppercase text-sm font-bold">
                            STATUS: KNOWN
                        </span>
                    </div>
                    <div className="prose prose-lg prose-terminal max-w-none text-term-text">
                        <p className="text-xl leading-8">
                            {selectedEntry.description}
                        </p>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-term-gray text-xs text-term-gray font-mono uppercase text-right bg-term-gray/5">
                    >> END OF RECORD
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default JournalView;