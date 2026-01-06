import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { geminiService } from './services/geminiService';
import { Character, ChatMessage, LoreEntry, TabView, LocationNode, GameState, GameStage, Npc, Item, Quest } from './types';
import { INITIAL_LORE_ENTRIES } from './constants';
import CharacterCreation from './components/CharacterCreation';
import StoryView from './components/StoryView';
import JournalView from './components/JournalView';
import MapView from './components/MapView';
import PeopleView from './components/PeopleView';
import InventoryView from './components/InventoryView';
import QuestView from './components/QuestView';
import { Scroll, Book, Map as MapIcon, ChevronRight, Terminal, Trash2, Globe, Users, Backpack, ScrollText } from 'lucide-react';

const SAVE_KEY = 'aetheria_save_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabView>(TabView.STORY);
  const [gameStage, setGameStage] = useState<GameStage>(GameStage.LOADING);
  const [loadingText, setLoadingText] = useState('INITIALIZING SYSTEM...');
  
  const [character, setCharacter] = useState<Character | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [lore, setLore] = useState<LoreEntry[]>([...INITIAL_LORE_ENTRIES]);
  const [locations, setLocations] = useState<LocationNode[]>([]);
  const [npcs, setNpcs] = useState<Npc[]>([]);
  const [inventory, setInventory] = useState<Item[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [gameState, setGameState] = useState<Partial<GameState>>({});
  
  const hasInitialized = useRef(false);

  // Load Game on Mount
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      const savedData = localStorage.getItem(SAVE_KEY);
      
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setCharacter(parsed.character);
          setMessages(parsed.messages);
          setLore(parsed.lore);
          setLocations(parsed.locations);
          setNpcs(parsed.npcs || []);
          setInventory(parsed.inventory || []);
          setQuests(parsed.quests || []);
          setGameState(parsed.gameState);
          setGameStage(parsed.gameStage);
          
          if (parsed.messages && parsed.messages.length > 0) {
             geminiService.resumeSession(parsed.messages).catch(console.error);
          }
        } catch (e) {
          console.error("Save file corrupted, starting new game.", e);
          initNewGame();
        }
      } else {
        initNewGame();
      }
    }
  }, []);

  useEffect(() => {
    if (gameStage !== GameStage.LOADING) {
      const stateToSave = {
        character,
        messages,
        lore,
        locations,
        npcs,
        inventory,
        quests,
        gameState,
        gameStage
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(stateToSave));
    }
  }, [character, messages, lore, locations, npcs, inventory, quests, gameState, gameStage]);

  const updateNpcState = (newNpcs: Npc[]) => {
      setNpcs(prev => {
          const updated = [...prev];
          newNpcs.forEach(newNpc => {
              const idx = updated.findIndex(n => n.name === newNpc.name);
              if (idx >= 0) {
                  updated[idx] = { ...updated[idx], ...newNpc };
              } else {
                  updated.push(newNpc);
              }
          });
          return updated;
      });
  };

  const updateInventoryState = (ops: any[]) => {
      setInventory(prev => {
          let updated = [...prev];
          ops.forEach(op => {
              if (op.action === 'add') {
                  const existingIdx = updated.findIndex(i => i.name === op.itemName);
                  if (existingIdx >= 0) {
                      updated[existingIdx].quantity += (op.quantity || 1);
                  } else if (op.itemDetails) {
                      updated.push({
                          id: Math.random().toString(36).substr(2, 9),
                          name: op.itemName,
                          type: op.itemDetails.type || 'Misc',
                          description: op.itemDetails.description || '',
                          quantity: op.quantity || 1,
                          isEquipped: false,
                          effect: op.itemDetails.effect
                      });
                  }
              } else if (op.action === 'remove') {
                   const existingIdx = updated.findIndex(i => i.name === op.itemName);
                   if (existingIdx >= 0) {
                       updated[existingIdx].quantity -= (op.quantity || 1);
                       if (updated[existingIdx].quantity <= 0) {
                           updated.splice(existingIdx, 1);
                       }
                   }
              } else if (op.action === 'equip') {
                   const existingIdx = updated.findIndex(i => i.name === op.itemName);
                   if (existingIdx >= 0) updated[existingIdx].isEquipped = true;
              } else if (op.action === 'unequip') {
                   const existingIdx = updated.findIndex(i => i.name === op.itemName);
                   if (existingIdx >= 0) updated[existingIdx].isEquipped = false;
              }
          });
          return updated;
      });
  };

  const updateQuestState = (ops: any[]) => {
      setQuests(prev => {
          let updated = [...prev];
          ops.forEach(op => {
              if (op.action === 'start') {
                  const existing = updated.find(q => q.title === op.questTitle);
                  if (!existing) {
                      updated.push({
                          id: Math.random().toString(36).substr(2, 9),
                          title: op.questTitle,
                          description: op.description || '',
                          status: 'Active',
                          objectives: op.objectives || []
                      });
                  }
              } else {
                   const idx = updated.findIndex(q => q.title === op.questTitle);
                   if (idx >= 0) {
                       if (op.action === 'complete') updated[idx].status = 'Completed';
                       if (op.action === 'fail') updated[idx].status = 'Failed';
                       if (op.action === 'update') {
                           if (op.description) updated[idx].description = op.description;
                           if (op.objectives) updated[idx].objectives = op.objectives;
                       }
                   }
              }
          });
          return updated;
      });
  };

  const initNewGame = async () => {
    setIsTyping(true);
    setMessages([]);
    setGameStage(GameStage.LOADING);
    setLocations([]);
    setLore([]);
    setNpcs([]);
    setInventory([]);
    setQuests([]);
    setGameState({});
    
    try {
      setLoadingText('GENERATING WORLD DATABASE...');
      const dataPrompt = `SYSTEM COMMAND: GENERATE WORLD DATA.
      1. GENERATE A NAME for this world/continent. Call 'setWorldContext' with it.
      2. Create a unique High Fantasy setting (Gritty, Realistic).
      3. Call 'updateJournal' to populate: 3 Major Gods, 3 Major Factions, 3 Major Races (include Humans), 3 Common Creatures.
      4. Call 'updateLocations' to populate: 3 Starting Locations (X/Y coords).
      Rules: Do NOT write story/prologue yet.`;

      await geminiService.sendMessage(dataPrompt,
        (newLore) => setLore(prev => [...prev, ...newLore]),
        (newLocs) => setLocations(prev => [...prev, ...newLocs]),
        undefined,
        (worldName) => setGameState(prev => ({ ...prev, worldName })),
        (newNpcs) => updateNpcState(newNpcs)
      );

      setLoadingText('WRITING CHRONICLES...');
      const prologuePrompt = `Excellent. Now write the # **World Codex** and # **Prologue** (Atmospheric). No footer yet.`;
      
      const response = await geminiService.sendMessage(prologuePrompt,
        (newLore) => setLore(prev => [...prev, ...newLore]),
        (newLocs) => setLocations(prev => [...prev, ...newLocs]),
        undefined,
        (worldName) => setGameState(prev => ({ ...prev, worldName })),
        (newNpcs) => updateNpcState(newNpcs)
      );
      
      setMessages([{ id: Date.now().toString(), role: 'model', text: response, timestamp: Date.now() }]);
      setGameStage(GameStage.PROLOGUE);

    } catch (e) {
      console.error(e);
      setMessages([{ id: 'err', role: 'system', text: "FATAL ERROR: AETHER DISCONNECTED.", timestamp: Date.now() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("WARNING: TERMINAL RESET. ALL DATA WILL BE LOST. PROCEED?")) {
      localStorage.removeItem(SAVE_KEY);
      window.location.href = window.location.href; 
    }
  };

  const handleCharacterComplete = async (char: Character) => {
    setCharacter(char);
    setGameStage(GameStage.PLAYING);
    setIsTyping(true);
    
    const introPrompt = `My character is ${char.name}, a ${char.race} ${char.occupation}. 
    Physicality: Height ${char.height}, Build ${char.build}.
    Strengths: ${char.strengths.join(', ')}. Weakness: ${char.weakness}.
    Background: ${char.background}. 
    Start the first scene. Place me in a starting location. Give me an objective.`;

    await processTurn(introPrompt);
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;
    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userText, timestamp: Date.now() }]);
    await processTurn(userText);
  };

  const processTurn = async (userText: string) => {
      setIsTyping(true);
      const systemLogs: string[] = [];

      // HELPER: To aggregate logs from callbacks
      const createLogHandler = (prefix: string, cb: any) => (data: any) => {
          cb(data);
          // Only log significant counts
          const count = Array.isArray(data) ? data.length : 1;
          systemLogs.push(`>> ${prefix}: ${count} UPDATED`);
      };

      try {
        // --- STEP 1: PLAYER ACTION & NARRATIVE RESPONSE ---
        const response = await geminiService.sendMessage(
            userText,
            createLogHandler('ARCHIVE', (newLore: any) => setLore(prev => [...prev, ...newLore])),
            createLogHandler('GRID', (newLocs: any) => setLocations(prev => [...prev, ...newLocs])),
            (reason, result, dc) => {
                setMessages(prev => [...prev, {
                    id: Date.now().toString() + 'roll',
                    role: 'system',
                    text: `CHECK: ${reason} [DC:${dc}]`,
                    isRoll: true,
                    rollResult: result,
                    rollDC: dc,
                    rollOutcome: result >= dc ? 'Success' : 'Failure',
                    timestamp: Date.now()
                }]);
            },
            (worldName) => setGameState(prev => ({ ...prev, worldName })),
            createLogHandler('DOSSIER', (newNpcs: any) => updateNpcState(newNpcs)),
            createLogHandler('INVENTORY', (invOps: any) => updateInventoryState(invOps)),
            createLogHandler('MISSION', (questOps: any) => updateQuestState(questOps))
        );

        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: response, timestamp: Date.now() }]);
        parseFooter(response);

        // DELAY TO PREVENT RATE LIMIT (429)
        // Since we are double-tapping the API (Action + Sim), we must throttle.
        await new Promise(r => setTimeout(r, 2000));

        // --- STEP 2: WORLD SIMULATION LOOP ---
        // This runs silently to update state or generate "Ambience" events
        const simResponse = await geminiService.sendMessage(
            "[SYSTEM]: EXECUTE WORLD SIMULATION. 1. **NPC Lives:** NPCs should travel, trade, fight, or quest off-screen (updatePeople). 2. **Faction Moves:** Advance plots (updateJournal). 3. **Ambience:** If the player PERCEIVES a result (e.g. 'A merchant complains about bandits', 'A rival adventurer returns wounded'), Narrate it. Otherwise, stay silent.",
            createLogHandler('ARCHIVE (SIM)', (newLore: any) => setLore(prev => [...prev, ...newLore])),
            createLogHandler('GRID (SIM)', (newLocs: any) => setLocations(prev => [...prev, ...newLocs])),
            undefined, 
            undefined,
            createLogHandler('DOSSIER (SIM)', (newNpcs: any) => updateNpcState(newNpcs)),
            undefined,
            createLogHandler('MISSION (SIM)', (questOps: any) => updateQuestState(questOps))
        );

        // If the sim produced narrative text (perceptible events), show it.
        if (simResponse && simResponse.trim().length > 0 && !simResponse.includes('--- NOVEL STATE ---')) {
             setMessages(prev => [...prev, { 
                 id: (Date.now() + 2).toString(), 
                 role: 'model', 
                 text: `*${simResponse.trim()}*`, // Italicize sim events
                 timestamp: Date.now() 
             }]);
        }
        
        // Append System Logs if any occurred during either step
        if (systemLogs.length > 0) {
            setMessages(prev => [...prev, { 
                id: (Date.now() + 3).toString(), 
                role: 'system', 
                text: systemLogs.join('\n'), 
                timestamp: Date.now() 
            }]);
        }

      } catch (error) {
          console.error("Game Error:", error);
      } finally {
        setIsTyping(false);
      }
  };

  const parseFooter = (text: string) => {
      if (!text.includes('--- NOVEL STATE ---')) return;
      const parts = text.split('--- NOVEL STATE ---');
      const footer = parts[parts.length - 1]; 
      if (footer) {
          const lines = footer.split('\n');
          const newState: Partial<GameState> = {};
          lines.forEach(line => {
              if (line.includes('Time:')) newState.time = line.split('Time:')[1].trim();
              if (line.includes('Condition:')) newState.health = line.split('Condition:')[1].split('|')[0].trim();
          });
          setGameState(prev => ({...prev, ...newState}));
      }
  };

  // --- Views Helpers ---

  const renderStoryContent = () => {
    if (gameStage === GameStage.LOADING) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-term-main font-mono text-2xl space-y-4">
                <div className="animate-pulse tracking-widest">[ {loadingText} ]</div>
                <div className="text-base text-term-gray uppercase">Decrypting Lore Modules...</div>
            </div>
        );
    }

    if (gameStage === GameStage.PROLOGUE) {
        const prologueMsg = messages.length > 0 ? messages[0] : null;
        return (
            <div className="flex flex-col h-full max-w-5xl mx-auto p-4 md:p-8 overflow-y-auto">
                <div className="flex-1">
                   {prologueMsg && (
                        <div className="prose prose-lg prose-terminal max-w-none text-term-text">
                            <ReactMarkdown>
                                {prologueMsg.text}
                            </ReactMarkdown>
                        </div>
                   )}
                </div>
                <div className="mt-12 flex justify-center pb-8">
                    <button 
                        onClick={() => setGameStage(GameStage.CREATION)}
                        className="group flex items-center gap-3 border-2 border-term-main text-term-main hover:bg-term-main hover:text-black px-10 py-5 font-bold uppercase tracking-widest transition-all text-xl"
                    >
                        <span>[ INITIALIZE CHARACTER ]</span>
                        <Terminal className="w-6 h-6" />
                    </button>
                </div>
            </div>
        );
    }

    if (gameStage === GameStage.CREATION) {
        return (
            <div className="h-full overflow-y-auto p-4">
                <CharacterCreation 
                  onComplete={handleCharacterComplete} 
                  lore={lore}
                  onBack={() => setGameStage(GameStage.PROLOGUE)}
                />
            </div>
        );
    }

    return <StoryView messages={messages} isTyping={isTyping} />;
  };

  return (
    <div className="flex h-screen bg-term-bg text-term-text overflow-hidden font-mono relative">
      <div className="scanlines"></div>
      
      {/* Sidebar Navigation */}
      <div className="w-20 md:w-64 bg-term-dark border-r border-term-gray/30 flex flex-col justify-between shrink-0 z-10">
        <div>
            <div className="p-6 border-b border-term-gray/30 hidden md:block">
                <h1 className="text-4xl font-bold text-term-main tracking-tighter leading-none text-shadow uppercase">
                  {gameState.worldName || 'UNKNOWN REALM'}
                </h1>
                <p className="text-xs text-term-gray mt-2 uppercase tracking-widest">
                    SESSION: {gameStage === GameStage.PLAYING ? 'ACTIVE' : 'STANDBY'}
                </p>
            </div>
            
            <nav className="flex flex-col space-y-1 mt-4">
                <button 
                    onClick={() => setActiveTab(TabView.STORY)}
                    className={`flex items-center gap-4 p-5 transition-all uppercase tracking-wider text-lg ${activeTab === TabView.STORY ? 'bg-term-main text-black font-bold' : 'text-term-gray hover:text-term-main hover:bg-term-gray/20'}`}
                >
                    <Scroll className="w-6 h-6" />
                    <span className="hidden md:block">LOG</span>
                </button>
                <button 
                    onClick={() => setActiveTab(TabView.JOURNAL)}
                    className={`flex items-center gap-4 p-5 transition-all uppercase tracking-wider text-lg ${activeTab === TabView.JOURNAL ? 'bg-term-main text-black font-bold' : 'text-term-gray hover:text-term-main hover:bg-term-gray/20'}`}
                >
                    <Book className="w-6 h-6" />
                    <span className="hidden md:block">DATA</span>
                </button>
                <button 
                    onClick={() => setActiveTab(TabView.MAP)}
                    className={`flex items-center gap-4 p-5 transition-all uppercase tracking-wider text-lg ${activeTab === TabView.MAP ? 'bg-term-main text-black font-bold' : 'text-term-gray hover:text-term-main hover:bg-term-gray/20'}`}
                >
                    <MapIcon className="w-6 h-6" />
                    <span className="hidden md:block">GRID</span>
                </button>
                 <button 
                    onClick={() => setActiveTab(TabView.PEOPLE)}
                    className={`flex items-center gap-4 p-5 transition-all uppercase tracking-wider text-lg ${activeTab === TabView.PEOPLE ? 'bg-term-main text-black font-bold' : 'text-term-gray hover:text-term-main hover:bg-term-gray/20'}`}
                >
                    <Users className="w-6 h-6" />
                    <span className="hidden md:block">PEOPLE</span>
                </button>
                <button 
                    onClick={() => setActiveTab(TabView.INVENTORY)}
                    className={`flex items-center gap-4 p-5 transition-all uppercase tracking-wider text-lg ${activeTab === TabView.INVENTORY ? 'bg-term-main text-black font-bold' : 'text-term-gray hover:text-term-main hover:bg-term-gray/20'}`}
                >
                    <Backpack className="w-6 h-6" />
                    <span className="hidden md:block">GEAR</span>
                </button>
                <button 
                    onClick={() => setActiveTab(TabView.QUESTS)}
                    className={`flex items-center gap-4 p-5 transition-all uppercase tracking-wider text-lg ${activeTab === TabView.QUESTS ? 'bg-term-main text-black font-bold' : 'text-term-gray hover:text-term-main hover:bg-term-gray/20'}`}
                >
                    <ScrollText className="w-6 h-6" />
                    <span className="hidden md:block">QUESTS</span>
                </button>
            </nav>
        </div>

        <div className="p-4 border-t border-term-gray/30 hidden md:block font-mono text-xs">
            {character ? (
                <div className="space-y-2 text-sm">
                    <div className="text-term-main uppercase border-b border-term-gray/30 pb-1 mb-2">STATUS</div>
                    <div className="flex justify-between">
                        <span className="text-term-gray">ID:</span>
                        <span className="text-term-text">{character.name}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-term-gray">JOB:</span>
                        <span className="text-term-text">{character.occupation}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                        <span className="text-term-gray">CONDITION:</span>
                        <span className="text-term-highlight truncate ml-2">
                            {gameState.health || 'OPTIMAL'}
                        </span>
                    </div>
                </div>
            ) : (
                <div className="text-term-gray italic text-center uppercase">
                    NO USER DETECTED
                </div>
            )}
            
            <button 
               onClick={handleReset}
               className="mt-6 flex items-center gap-2 text-term-red hover:text-red-400 uppercase tracking-wider w-full pt-4 border-t border-term-gray/30"
            >
               <Trash2 className="w-4 h-4" /> 
               <span>Hard Reset</span>
            </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative bg-term-bg z-10">
        
        <div className="flex-1 overflow-hidden relative">
            {activeTab === TabView.STORY && renderStoryContent()}
            {activeTab === TabView.JOURNAL && <JournalView entries={lore} />}
            {activeTab === TabView.MAP && <MapView locations={locations} gameState={gameState} />}
            {activeTab === TabView.PEOPLE && <PeopleView npcs={npcs} />}
            {activeTab === TabView.INVENTORY && <InventoryView items={inventory} />}
            {activeTab === TabView.QUESTS && <QuestView quests={quests} />}
        </div>

        {activeTab === TabView.STORY && gameStage === GameStage.PLAYING && (
            <div className="p-4 bg-term-dark border-t border-term-gray/30">
                <form onSubmit={handleSend} className="max-w-6xl mx-auto relative flex gap-0">
                    <div className="flex items-center justify-center bg-term-dark border-l border-t border-b border-term-gray/30 pl-4 pr-2 text-term-main">
                        <ChevronRight className={`w-6 h-6 ${isTyping ? 'animate-pulse' : ''}`} />
                    </div>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="ENTER COMMAND..."
                        disabled={isTyping}
                        className="w-full bg-term-dark text-term-text font-mono text-xl border-t border-b border-r border-term-gray/30 p-4 focus:outline-none focus:border-term-main placeholder-term-gray/50 uppercase"
                        autoFocus
                    />
                </form>
            </div>
        )}
      </div>
    </div>
  );
}