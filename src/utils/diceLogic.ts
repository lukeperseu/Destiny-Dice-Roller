import { ComplexDiceType, ComplexDiceStates, DiceType, RollLog } from '../types';

export const INITIAL_COMPLEX_STATES: ComplexDiceStates = {
  d10: {
    counts: {},
    blockedQueue: [],
    maxBlocked: 5,
    triggers: [1, 2, 5, 6, 9, 10],
  },
  d20: {
    counts: {},
    blockedQueue: [],
    maxBlocked: 10,
    triggers: [1, 2, 10, 11, 19, 20],
  },
  d100: {
    counts: {},
    blockedQueue: [],
    maxBlocked: 50,
    triggers: [
      1, 2, 3, 4, 5,
      50, 51,
      95, 96, 97, 98, 99, 100
    ],
  },
};

export function getSides(diceType: DiceType): number {
  switch (diceType) {
    case 'd4': return 4;
    case 'd6': return 6;
    case 'd8': return 8;
    case 'd10': return 10;
    case 'd20': return 20;
    case 'd100': return 100;
  }
}

export function getRandomInt(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

/**
 * Rolls a simple die (d4, d6, d8)
 */
export function rollSimpleDice(diceType: DiceType): RollLog {
  const sides = getSides(diceType);
  const result = getRandomInt(sides);
  return {
    id: `${diceType}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    diceType,
    result,
    timestamp: Date.now(),
    isComplex: false,
  };
}

/**
 * Validates a candidate average result considering the current FIFO block queue and Secret d6 Inversion.
 */
function validateCandidate(
  sides: number,
  initialCandidate: number,
  blockedQueue: number[],
  isInverted: boolean
): number {
  let candidate = initialCandidate;
  let attempts = 0;

  // Max 100 reroll attempts to prevent infinite loop
  while (attempts < 100) {
    const isBlockedInNormal = blockedQueue.includes(candidate);

    if (isInverted) {
      // In Inversion Mode:
      // If blockedQueue has items, candidate MUST be inside blockedQueue.
      // If blockedQueue is empty, any candidate is accepted.
      if (blockedQueue.length === 0 || isBlockedInNormal) {
        return candidate;
      }
    } else {
      // Normal Mode: candidate MUST NOT be in blockedQueue.
      if (!isBlockedInNormal) {
        return candidate;
      }
    }

    // Generate new 3-dice average
    const d1 = getRandomInt(sides);
    const d2 = getRandomInt(sides);
    const d3 = getRandomInt(sides);
    candidate = Math.round((d1 + d2 + d3) / 3);
    attempts++;
  }

  // Fallback if loop finishes: pick candidate
  return candidate;
}

/**
 * Rolls a complex die (d10, d20, d100) applying the secret 4th die trigger rule,
 * the secret d6 inversion rule, and the FIFO block queue.
 */
export function rollComplexDice(
  diceType: ComplexDiceType,
  currentState: ComplexDiceStates
): { rollLog: RollLog; updatedStates: ComplexDiceStates } {
  const sides = getSides(diceType);
  const state = currentState[diceType];

  // 1. Roll Secret 5th die (d6 Inversion Mechanic)
  const d6Inversion = getRandomInt(6);
  const isInverted = d6Inversion === 6;

  // 2. Roll 4 internal secret dice
  const d1 = getRandomInt(sides);
  const d2 = getRandomInt(sides);
  const d3 = getRandomInt(sides);
  const d4Secret = getRandomInt(sides);

  let finalResult: number;
  let isTriggerResult = false;
  let averageOf3: number | undefined;

  // Clone state for mutation safety
  const updatedState = {
    ...state,
    counts: { ...state.counts },
    blockedQueue: [...state.blockedQueue],
  };

  // 3. Check 4th Die Trigger Rule
  if (state.triggers.includes(d4Secret)) {
    // 4th die trigger hit! Bypasses average and blocking checks.
    finalResult = d4Secret;
    isTriggerResult = true;
  } else {
    // Calculate average of first 3 dice
    averageOf3 = Math.round((d1 + d2 + d3) / 3);

    // Validate average result against blocking & inversion
    finalResult = validateCandidate(sides, averageOf3, updatedState.blockedQueue, isInverted);

    // Update blocking queue and counts (Triggers never block)
    if (!state.triggers.includes(finalResult)) {
      const currentCount = (updatedState.counts[finalResult] || 0) + 1;
      updatedState.counts[finalResult] = currentCount;

      // If hit 3 times and not currently in blockedQueue
      if (currentCount >= 3 && !updatedState.blockedQueue.includes(finalResult)) {
        updatedState.blockedQueue.push(finalResult);

        // FIFO Queue Overflow check
        if (updatedState.blockedQueue.length > updatedState.maxBlocked) {
          const released = updatedState.blockedQueue.shift();
          if (released !== undefined) {
            updatedState.counts[released] = 0; // Reset count for unblocked number
          }
        }
      }
    }
  }

  const rollLog: RollLog = {
    id: `${diceType}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    diceType,
    result: finalResult,
    timestamp: Date.now(),
    isComplex: true,
    secretDice: {
      d1,
      d2,
      d3,
      d4Secret,
      d6Inversion,
    },
    isInverted,
    isTriggerResult,
    averageOf3,
  };

  const updatedStates: ComplexDiceStates = {
    ...currentState,
    [diceType]: updatedState,
  };

  return { rollLog, updatedStates };
}

/**
 * Calculates average of an array of RollLogs
 */
export function calculateAverage(logs: RollLog[]): number {
  if (logs.length === 0) return 0;
  const sum = logs.reduce((acc, curr) => acc + curr.result, 0);
  return Number((sum / logs.length).toFixed(1));
}

/**
 * Calculates median of an array of RollLogs
 */
export function calculateMedian(logs: RollLog[]): number {
  if (logs.length === 0) return 0;
  const numbers = logs.map(l => l.result).sort((a, b) => a - b);
  const mid = Math.floor(numbers.length / 2);

  if (numbers.length % 2 === 0) {
    return Number(((numbers[mid - 1] + numbers[mid]) / 2).toFixed(1));
  }
  return numbers[mid];
}
