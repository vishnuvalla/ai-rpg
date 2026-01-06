import React, { useState } from 'react';
import { Character, LoreEntry } from '../types';
import { ArrowLeft } from 'lucide-react';

interface Props {
  onComplete: (char: Character) => void;
  lore: LoreEntry[];
  onBack: () => void;
}

const CharacterCreation: React.FC<Props> = ({ onComplete, lore, onBack }) => {
  // Extract races from lore, default to Human if missing
  const races = lore
    .filter(e => e.type === 'Race')
    .map(e => e.title);
  
  const availableRaces = races.length > 0 ? races : ['Human', 'Elf', 'Dwarf', 'Orc'];

  const [formData, setFormData] = useState<Character>({
    name: '',
    race: availableRaces[0],
    occupation: '',
    background: '',
    height: '',
    build: '',
    strengths: ['', '', ''],
    weakness: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleStrengthChange = (index: number, value: string) => {
    const newStrengths = [...formData.strengths] as [string, string, string];
    newStrengths[index] = value;
    setFormData({ ...formData, strengths: newStrengths });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(formData);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 border-2 border-term-gray bg-term-dark mt-8 shadow-lg relative">
      <div className="flex items-center justify-between mb-6 border-b border-term-gray pb-2">
         <h2 className="text-2xl text-term-main uppercase tracking-widest">
            > User_Profile_Init
         </h2>
         <button 
           onClick={onBack}
           className="flex items-center gap-2 text-term-gray hover:text-term-main transition-colors uppercase text-sm"
         >
           <ArrowLeft className="w-4 h-4" /> Return to Prologue
         </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Row 1: Name & Race */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
            <label className="block text-term-text text-sm uppercase mb-1">Identity Code (Name)</label>
            <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-term-bg text-term-text border border-term-gray p-3 focus:outline-none focus:border-term-main focus:bg-term-gray/10 font-mono uppercase transition-colors"
                placeholder="ENTER NAME..."
            />
            </div>
            <div>
            <label className="block text-term-text text-sm uppercase mb-1">Biological_Type</label>
            <select
                name="race"
                value={formData.race}
                onChange={handleChange}
                className="w-full bg-term-bg text-term-text border border-term-gray p-3 focus:outline-none focus:border-term-main font-mono uppercase transition-colors"
            >
                {availableRaces.map(r => (
                    <option key={r} value={r}>{r}</option>
                ))}
            </select>
            </div>
        </div>

        {/* Row 2: Occupation, Height, Build */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-term-text text-sm uppercase mb-1">Occupation</label>
            <input
              type="text"
              name="occupation"
              value={formData.occupation}
              onChange={handleChange}
              className="w-full bg-term-bg text-term-text border border-term-gray p-3 focus:outline-none focus:border-term-main focus:bg-term-gray/10 font-mono uppercase transition-colors"
              placeholder="E.G. MERCENARY"
            />
          </div>
          <div>
            <label className="block text-term-text text-sm uppercase mb-1">Height</label>
            <input
              type="text"
              name="height"
              value={formData.height}
              onChange={handleChange}
              className="w-full bg-term-bg text-term-text border border-term-gray p-3 focus:outline-none focus:border-term-main focus:bg-term-gray/10 font-mono uppercase transition-colors"
              placeholder="E.G. 6'2"
            />
          </div>
           <div>
            <label className="block text-term-text text-sm uppercase mb-1">Build</label>
            <input
              type="text"
              name="build"
              value={formData.build}
              onChange={handleChange}
              className="w-full bg-term-bg text-term-text border border-term-gray p-3 focus:outline-none focus:border-term-main focus:bg-term-gray/10 font-mono uppercase transition-colors"
              placeholder="E.G. WIRY"
            />
          </div>
        </div>

        {/* Strengths */}
        <div>
           <label className="block text-term-text text-sm uppercase mb-1">Key Assets (3 Strengths)</label>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
               <input
                type="text"
                required
                value={formData.strengths[0]}
                onChange={(e) => handleStrengthChange(0, e.target.value)}
                className="bg-term-bg text-term-text border border-term-gray p-2 focus:outline-none focus:border-term-main font-mono uppercase"
                placeholder="ASSET 1"
                />
                 <input
                type="text"
                required
                value={formData.strengths[1]}
                onChange={(e) => handleStrengthChange(1, e.target.value)}
                className="bg-term-bg text-term-text border border-term-gray p-2 focus:outline-none focus:border-term-main font-mono uppercase"
                placeholder="ASSET 2"
                />
                 <input
                type="text"
                required
                value={formData.strengths[2]}
                onChange={(e) => handleStrengthChange(2, e.target.value)}
                className="bg-term-bg text-term-text border border-term-gray p-2 focus:outline-none focus:border-term-main font-mono uppercase"
                placeholder="ASSET 3"
                />
           </div>
        </div>

        {/* Weakness */}
        <div>
          <label className="block text-term-text text-sm uppercase mb-1 text-term-red">Fatal Flaw (Weakness)</label>
          <input
              type="text"
              name="weakness"
              required
              value={formData.weakness}
              onChange={handleChange}
              className="w-full bg-term-bg text-term-text border border-term-red p-3 focus:outline-none focus:border-term-red focus:bg-term-gray/10 font-mono uppercase transition-colors placeholder-red-900/50"
              placeholder="ENTER WEAKNESS..."
            />
        </div>

        <div>
          <label className="block text-term-text text-sm uppercase mb-1">Origin_Story</label>
          <textarea
            name="background"
            rows={3}
            value={formData.background}
            onChange={handleChange}
            className="w-full bg-term-bg text-term-text border border-term-gray p-3 focus:outline-none focus:border-term-main focus:bg-term-gray/10 font-mono uppercase transition-colors"
            placeholder="DATA..."
          />
        </div>

        <button
          type="submit"
          className="w-full bg-term-main text-black font-bold py-3 px-4 border border-term-main hover:bg-term-highlight hover:text-black transition duration-200 uppercase tracking-widest mt-4"
        >
          [ EXECUTE START ]
        </button>
      </form>
    </div>
  );
};

export default CharacterCreation;