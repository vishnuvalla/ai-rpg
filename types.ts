export interface Character {
  name: string;
  race: string;
  occupation: string;
  background: string;
  height: string;
  build: string;
  strengths: [string, string, string];
  weakness: string;
}

export interface LoreEntry {
  id: string;
  title: string;
  type: 'Faction' | 'God' | 'Location' | 'Race' | 'Magic' | 'Creature' | 'Other';
  description: string;
  known: boolean;
}

export interface Npc {
  id: string;
  name: string;
  role: string;
  description: string;
  disposition: string; // e.g., "Friendly", "Hostile", "Wary"
  location: string;    // Current location or known route
  status: 'Alive' | 'Deceased' | 'Missing' | 'Unknown';
}

export interface Item {
  id: string;
  name: string;
  type: 'Weapon' | 'Armor' | 'Consumable' | 'Key Item' | 'Material' | 'Misc' | 'Focus' | 'Artifact';
  description: string;
  quantity: number;
  isEquipped: boolean;
  effect?: string; // e.g., "+10% Magic Efficiency"
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  status: 'Active' | 'Completed' | 'Failed';
  objectives: string[];
}

export interface GameState {
  worldName: string;
  health: string;
  stamina: string;
  time: string;
  wounds: string;
  inventory: string; // Kept for legacy/text-footer sync
  leads: string;
  activeLore: string;
}

export type MessageRole = 'user' | 'model' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  isRoll?: boolean;
  rollResult?: number;
  rollDC?: number;
  rollOutcome?: 'Success' | 'Failure' | 'Mixed';
  timestamp: number;
}

export enum TabView {
  STORY = 'STORY',
  JOURNAL = 'JOURNAL',
  MAP = 'MAP',
  PEOPLE = 'PEOPLE',
  INVENTORY = 'INVENTORY',
  QUESTS = 'QUESTS',
  CHARACTER = 'CHARACTER',
}

export enum GameStage {
  LOADING = 'LOADING',
  PROLOGUE = 'PROLOGUE',
  CREATION = 'CREATION',
  PLAYING = 'PLAYING',
}

export interface LocationNode {
  name: string;
  type: 'City' | 'Forest' | 'Dungeon' | 'Village' | 'Ruins' | 'Temple' | 'Landmark';
  coordinates: { x: number; y: number };
  description: string;
}