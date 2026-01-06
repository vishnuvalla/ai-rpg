import { GoogleGenAI, FunctionDeclaration, Type, Content, Chat, GenerateContentResponse, Part } from "@google/genai";
import { SYSTEM_PROMPT } from '../constants';
import { LoreEntry, LocationNode, ChatMessage, Npc, Item, Quest } from '../types';

// Define Tools
const rollDiceTool: FunctionDeclaration = {
  name: 'rollDice',
  description: 'Rolls a d100 dice to determine the outcome of a risky action.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      reason: { type: Type.STRING, description: 'The reason for the roll (e.g., "Climbing the wall", "Attacking the guard")' },
      difficulty: { type: Type.INTEGER, description: 'The target number (DC) to beat (0-100).' },
    },
    required: ['reason', 'difficulty'],
  },
};

const updateJournalTool: FunctionDeclaration = {
  name: 'updateJournal',
  description: 'Updates the player journal with new lore entries.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      entries: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['Faction', 'God', 'Location', 'Race', 'Magic', 'Creature', 'Other'] },
            description: { type: Type.STRING },
          },
          required: ['title', 'type', 'description'],
        },
      },
    },
    required: ['entries'],
  },
};

const updateLocationsTool: FunctionDeclaration = {
  name: 'updateLocations',
  description: 'Updates the map with known locations using relative coordinates (in miles).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      locations: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['City', 'Forest', 'Dungeon', 'Village', 'Ruins', 'Temple', 'Landmark'] },
            x: { type: Type.INTEGER, description: "X Coordinate in miles relative to map center (Player starts near 0,0). Scale is large (-1500 to 1500)." },
            y: { type: Type.INTEGER, description: "Y Coordinate in miles relative to map center (Player starts near 0,0). Scale is large (-1500 to 1500)." },
            description: { type: Type.STRING },
          },
          required: ['name', 'type', 'x', 'y', 'description'],
        },
      },
    },
    required: ['locations'],
  },
};

const updatePeopleTool: FunctionDeclaration = {
    name: 'updatePeople',
    description: 'Updates the dossier of known NPCs, tracking their disposition and location.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            npcs: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        role: { type: Type.STRING, description: "Occupation or Title" },
                        description: { type: Type.STRING, description: "Physical description and notes" },
                        disposition: { type: Type.STRING, description: "Current relationship: Friendly, Neutral, Wary, Hostile, Indebted, etc." },
                        location: { type: Type.STRING, description: "Where they are currently located or their known travel route." },
                        status: { type: Type.STRING, enum: ['Alive', 'Deceased', 'Missing', 'Unknown'] }
                    },
                    required: ['name', 'role', 'description', 'disposition', 'location', 'status']
                }
            }
        },
        required: ['npcs']
    }
}

const manageInventoryTool: FunctionDeclaration = {
    name: 'manageInventory',
    description: 'Adds, removes, or updates items in the player inventory.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            operations: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        action: { type: Type.STRING, enum: ['add', 'remove', 'equip', 'unequip'], description: "The action to perform." },
                        itemName: { type: Type.STRING },
                        quantity: { type: Type.INTEGER, description: "Quantity to add or remove. Default 1." },
                        itemDetails: {
                            type: Type.OBJECT,
                            description: "Required for 'add' action. Details about the item.",
                            properties: {
                                type: { type: Type.STRING, enum: ['Weapon', 'Armor', 'Consumable', 'Key Item', 'Material', 'Misc', 'Focus', 'Artifact'] },
                                description: { type: Type.STRING },
                                effect: { type: Type.STRING, description: "Magical effect or stat bonus if any." }
                            }
                        }
                    },
                    required: ['action', 'itemName']
                }
            }
        },
        required: ['operations']
    }
}

const manageQuestsTool: FunctionDeclaration = {
    name: 'manageQuests',
    description: 'Starts, updates, or completes quests.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            operations: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        action: { type: Type.STRING, enum: ['start', 'update', 'complete', 'fail'], description: "Action to perform." },
                        questTitle: { type: Type.STRING },
                        description: { type: Type.STRING, description: "Description or new journal entry for the quest." },
                        objectives: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Current active objectives." }
                    },
                    required: ['action', 'questTitle']
                }
            }
        },
        required: ['operations']
    }
}

const setWorldContextTool: FunctionDeclaration = {
    name: 'setWorldContext',
    description: 'Sets the name of the world/continent generated.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            worldName: { type: Type.STRING, description: "The name of the fantasy world/continent." }
        },
        required: ['worldName']
    }
}

export class GeminiService {
  private ai: GoogleGenAI;
  private chatSession: Chat | undefined;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.API_KEY || '';
    if (!this.apiKey) {
      console.error("API_KEY not found in environment variables.");
    }
    this.ai = new GoogleGenAI({ apiKey: this.apiKey });
  }

  async startSession() {
    this.chatSession = this.ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: SYSTEM_PROMPT,
        tools: [{ functionDeclarations: [
            rollDiceTool, 
            updateJournalTool, 
            updateLocationsTool, 
            updatePeopleTool, 
            manageInventoryTool, 
            manageQuestsTool, 
            setWorldContextTool
        ] }],
      },
    });
  }

  // Restore session from saved messages
  async resumeSession(history: ChatMessage[]) {
    // Convert app format back to Gemini format
    const formattedHistory: Content[] = history
      .filter(msg => msg.role === 'user' || msg.role === 'model')
      .map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));

    this.chatSession = this.ai.chats.create({
      model: 'gemini-3-pro-preview',
      history: formattedHistory,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        tools: [{ functionDeclarations: [
            rollDiceTool, 
            updateJournalTool, 
            updateLocationsTool, 
            updatePeopleTool, 
            manageInventoryTool, 
            manageQuestsTool, 
            setWorldContextTool
        ] }],
      },
    });
  }

  // Helper for exponential backoff retry on 429/503 errors
  private async withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      const isRateLimit = 
        error?.status === 429 || 
        error?.status === 503 || 
        (error?.message && (error.message.includes('429') || error.message.includes('quota') || error.message.includes('503')));
      
      if (isRateLimit && retries > 0) {
        console.warn(`[GeminiService] Rate limit hit. Retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.withRetry(fn, retries - 1, delay * 2);
      }
      throw error;
    }
  }

  async sendMessage(
    message: string, 
    onJournalUpdate?: (entries: LoreEntry[]) => void,
    onLocationsUpdate?: (locs: LocationNode[]) => void,
    onRoll?: (reason: string, result: number, dc: number) => void,
    onWorldUpdate?: (name: string) => void,
    onNpcUpdate?: (npcs: Npc[]) => void,
    onInventoryUpdate?: (ops: any[]) => void,
    onQuestUpdate?: (ops: any[]) => void
  ): Promise<string> {
    
    if (!this.chatSession) await this.startSession();
    if (!this.chatSession) throw new Error("Chat session not initialized");

    let response: GenerateContentResponse = await this.withRetry(() => this.chatSession!.sendMessage({ message }));
    let fullText = "";

    // Handle Function Calls loop (The model might call multiple tools before final text)
    while (response.functionCalls && response.functionCalls.length > 0) {
      const functionResponses: Part[] = [];

      for (const call of response.functionCalls) {
        let toolResult = {};

        if (call.name === 'rollDice') {
          const { reason, difficulty } = call.args as any;
          const roll = Math.floor(Math.random() * 100) + 1;
          const outcome = roll >= difficulty ? "Success" : "Failure";
          toolResult = { result: roll, outcome: outcome };
          if (onRoll) onRoll(reason, roll, difficulty);
        } 
        else if (call.name === 'updateJournal') {
          const { entries } = call.args as any;
          if (onJournalUpdate) {
            const taggedEntries = entries.map((e: any) => ({ ...e, id: Math.random().toString(36).substr(2, 9), known: true }));
            onJournalUpdate(taggedEntries);
          }
          toolResult = { status: 'journal_updated' };
        }
        else if (call.name === 'updateLocations') {
            const { locations } = call.args as any;
            
            // 1. Update Map
            if(onLocationsUpdate) {
                const nodes = locations.map((l: any) => ({
                    name: l.name,
                    type: l.type,
                    description: l.description,
                    coordinates: { x: l.x, y: l.y }
                }));
                onLocationsUpdate(nodes);
            }

            // 2. SYNC WITH JOURNAL
            if (onJournalUpdate) {
                const locationEntries: LoreEntry[] = locations.map((l: any) => ({
                    id: Math.random().toString(36).substr(2, 9),
                    title: l.name,
                    type: 'Location',
                    description: `[${l.type}] ${l.description}`,
                    known: true
                }));
                onJournalUpdate(locationEntries);
            }

            toolResult = { status: 'map_updated' };
        }
        else if (call.name === 'updatePeople') {
            const { npcs } = call.args as any;
            if (onNpcUpdate) {
                const taggedNpcs = npcs.map((n: any) => ({ ...n, id: Math.random().toString(36).substr(2, 9) }));
                onNpcUpdate(taggedNpcs);
            }
            toolResult = { status: 'dossier_updated' };
        }
        else if (call.name === 'manageInventory') {
            const { operations } = call.args as any;
            if (onInventoryUpdate) {
                onInventoryUpdate(operations);
            }
            toolResult = { status: 'inventory_updated' };
        }
        else if (call.name === 'manageQuests') {
            const { operations } = call.args as any;
            if (onQuestUpdate) {
                onQuestUpdate(operations);
            }
            toolResult = { status: 'quests_updated' };
        }
        else if (call.name === 'setWorldContext') {
            const { worldName } = call.args as any;
            if (onWorldUpdate) {
                onWorldUpdate(worldName);
            }
            toolResult = { status: 'world_name_set' };
        }

        // Correctly structure the function response part
        functionResponses.push({
          functionResponse: {
            name: call.name,
            response: toolResult,
            id: call.id
          }
        });
      }

      // Send tool outputs back to model to get the narrative continuation
      // Use closure variable to ensure correct data path in retry
      const responsesToSend = functionResponses;
      response = await this.withRetry(() => this.chatSession!.sendMessage({ message: responsesToSend }));
    }

    fullText = response.text || "";
    return fullText;
  }
}

export const geminiService = new GeminiService();