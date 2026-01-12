
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
}

export enum GamePhase {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  QUIZ = 'QUIZ',
  EVENT = 'EVENT',
  GAMEOVER = 'GAMEOVER'
}
