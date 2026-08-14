export type SimpleDiceType = 'd4' | 'd6' | 'd8';
export type ComplexDiceType = 'd10' | 'd20' | 'd100';
export type DiceType = SimpleDiceType | ComplexDiceType;

export interface RollLog {
  id: string;
  diceType: DiceType;
  result: number;
  timestamp: number;
  // Player attribution
  playerName?: string;
  playerPhoto?: string;
  playerUid?: string;
  gmUid?: string;
  // Secret metadata (visible in GM Inspector)
  isComplex?: boolean;
  secretDice?: {
    d1: number;
    d2: number;
    d3: number;
    d4Secret: number;
    d6Inversion: number; // 1 to 6
  };
  isInverted?: boolean;
  isTriggerResult?: boolean;
  averageOf3?: number;
}

export interface ComplexDiceState {
  counts: Record<number, number>;
  blockedQueue: number[];
  maxBlocked: number;
  triggers: number[];
}

export type ComplexDiceStates = {
  [K in ComplexDiceType]: ComplexDiceState;
};

export type HistoryData = {
  [K in DiceType]: RollLog[];
};
