
export type Language = 'EN' | 'ID';

export interface Upgrades {
  drillLevel: number;
  refineLevel: number;
  researchLevel: number;
  renewableLevel: number;
}

export interface GameStats {
  year: number;
  month: number;
  turnsRemaining: number;
  cash: number;
  crudeOil: number;
  refinedProducts: number;
  pollution: number;
  approval: number;
  knowledge: number;
  renewableCapacity: number;
  upgrades: Upgrades;
  language: Language;
}

// Fix: Updated title and description to be localized records to match industrial requirements
export interface Achievement {
  id: string;
  title: Record<Language, string>;
  description: Record<Language, string>;
  icon: string;
  criteria: (stats: GameStats) => boolean;
  unlockedAt?: number;
}

export interface NewsEvent {
  title: string;
  description: string;
  impact: {
    stat: keyof GameStats;
    value: number;
  };
  options?: {
    label: string;
    impact: Partial<GameStats>;
  }[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export enum GamePhase {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  QUIZ = 'QUIZ',
  EVENT = 'EVENT',
  GAMEOVER = 'GAMEOVER',
  YEARLY_REVIEW = 'YEARLY_REVIEW'
}