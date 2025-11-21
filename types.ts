export interface JournalEntry {
  id: string;
  date: string; // ISO String
  content: string;
  images: string[]; // Base64 strings
  mood?: string;
  tags?: string[];
}

export interface ImportData {
  entries: {
    text: string;
    date: string; // or timestamp
    photos?: string[];
  }[];
}

export enum AppView {
  TIMELINE = 'TIMELINE',
  EDITOR = 'EDITOR',
  IMPORT = 'IMPORT',
  MTV = 'MTV',
  DETAIL = 'DETAIL',
  LIFE_CINEMA = 'LIFE_CINEMA'
}

export enum GenerationStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

// Augment window for AI Studio key selection
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}