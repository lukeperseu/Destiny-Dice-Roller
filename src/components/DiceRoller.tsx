import React, { useState } from 'react';
import { ComplexDiceStates, DiceType, RollLog } from '../types';
import { rollComplexDice, rollSimpleDice } from '../utils/diceLogic';
import { playCriticalSound, playDiceRollSound, playInversionSound } from '../utils/audio';
import { DiceIcon } from './DiceIcon';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Sparkles, AlertTriangle, Zap, Eye, RefreshCw, Hash } from 'lucide-react';

interface DiceRollerProps {
  complexStates: ComplexDiceStates;
  onStateUpdate: (newStates: ComplexDiceStates) => void;
  onAddLog: (log: RollLog) => void;
  soundEnabled: boolean;
  isGmMode: boolean;
  onSelectLogToInspect?: (log: RollLog) => void;
}

const ALL_DICE: DiceType[] = ['d4', 'd6', 'd8', 'd10', 'd20', 'd100'];

export const DiceRoller: React.FC<DiceRollerProps> = ({
  complexStates,
  onStateUpdate,
  onAddLog,
  soundEnabled,
  isGmMode,
  onSelectLogToInspect,
}) => {
  const [selectedDice, setSelectedDice] = useState<DiceType>('d20');
  const [lastLog, setLastLog] = useState<RollLog | null>(null);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [modifier, setModifier] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);

  // Roll execution
  const executeRoll = (diceType: DiceType) => {
    if (isRolling) return;
    setIsRolling(true);
    playDiceRollSound(soundEnabled);

    // Simulate dice tumbling time
    setTimeout(() => {
      let finalLog: RollLog | null = null;
      let tempStates = { ...complexStates };

      for (let i = 0; i < quantity; i++) {
        if (['d10', 'd20', 'd100'].includes(diceType)) {
          const { rollLog, updatedStates } = rollComplexDice(diceType as 'd10' | 'd20' | 'd100', tempStates);
          tempStates = updatedStates;
          finalLog = rollLog;
          onAddLog(rollLog);
        } else {
          const rollLog = rollSimpleDice(diceType);
          finalLog = rollLog;
          onAddLog(rollLog);
        }
      }

      if (['d10', 'd20', 'd100'].includes(diceType)) {
        onStateUpdate(tempStates);
      }

      if (finalLog) {
        setLastLog(finalLog);

        // Check for special audio / particle feedback
        if (finalLog.isInverted) {
          playInversionSound(soundEnabled);
        } else if (
          (diceType === 'd20' && finalLog.result === 20) ||
          (diceType === 'd100' && finalLog.result >= 95) ||
          (diceType === 'd10' && finalLog.result === 10)
        ) {
          playCriticalSound(soundEnabled);
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
          });
        }
      }

      setIsRolling(false);
    }, 400);
  };

  const currentResultWithModifier = lastLog ? lastLog.result + modifier : null;

  return (
    <div className="flex-1 flex flex-col items-center justify-between p-6 sm:p-10 overflow-y-auto custom-scrollbar relative bg-[#0c0e18]">
      {/* Top Banner Status (Inversion / Trigger Alerts) */}
      <div className="w-full max-w-lg min-h-[40px] flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {lastLog?.isInverted && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full bg-purple-950/80 border border-purple-500/50 rounded-xl p-2.5 text-purple-200 flex items-center justify-between shadow-lg"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-purple-400 shrink-0 animate-pulse" />
                <span className="font-bold text-xs text-purple-300">
                  Inversão d6 Ativada! (d6 = 6) - Média com bloqueio invertido
                </span>
              </div>
            </motion.div>
          )}

          {!lastLog?.isInverted && lastLog?.isTriggerResult && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full bg-rose-950/80 border border-rose-500/50 rounded-xl p-2.5 text-rose-200 flex items-center justify-between shadow-lg"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="font-bold text-xs text-rose-300">
                  4º Dado Ativado! Sobrepôs à média com extrema precisão
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Roll Result Display - Giant Glowing Number as in screenshot */}
      <div className="my-auto flex flex-col items-center justify-center text-center py-6 w-full">
        <motion.div
          key={lastLog ? `${lastLog.id}-${currentResultWithModifier}` : 'empty'}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="relative select-none cursor-pointer"
          onClick={() => executeRoll(selectedDice)}
        >
          {isRolling ? (
            <div className="h-40 flex items-center justify-center">
              <RefreshCw className="w-20 h-20 text-[#ff3b5c] animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              {lastLog?.playerName && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-2">
                  {lastLog.playerPhoto && (
                    <img
                      src={lastLog.playerPhoto}
                      alt={lastLog.playerName}
                      className="w-4 h-4 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <span>Rolado por {lastLog.playerName}</span>
                </div>
              )}

              <span className="text-[120px] sm:text-[170px] font-extrabold font-sans leading-none text-white tracking-tight drop-shadow-[0_0_40px_rgba(255,59,92,0.85)]">
                {currentResultWithModifier !== null ? currentResultWithModifier : '?'}
              </span>

              {modifier !== 0 && lastLog && (
                <span className="text-xs text-slate-400 font-mono mt-2">
                  Base: {lastLog.result} ({modifier >= 0 ? `+${modifier}` : modifier})
                </span>
              )}
            </div>
          )}
        </motion.div>

        {isGmMode && lastLog && (
          <button
            onClick={() => onSelectLogToInspect?.(lastLog)}
            className="mt-2 text-xs text-amber-400 hover:underline flex items-center gap-1 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20"
          >
            <Eye className="w-3.5 h-3.5" /> Ver Bastidores GM
          </button>
        )}
      </div>

      {/* 6 Dice Buttons Grid matching screenshot layout */}
      <div className="w-full max-w-md space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {ALL_DICE.map(dice => {
            const isSelected = selectedDice === dice;

            return (
              <button
                key={dice}
                onClick={() => {
                  setSelectedDice(dice);
                  executeRoll(dice);
                }}
                disabled={isRolling}
                className={`py-4 px-4 rounded-xl flex items-center justify-center font-bold text-lg sm:text-xl transition-all shadow-md active:scale-95 border ${
                  isSelected
                    ? 'bg-[#1e2a4a] text-white border-[#ff3b5c] shadow-rose-950/40 ring-2 ring-[#ff3b5c]/50'
                    : 'bg-[#162038] text-white border-[#222e4e] hover:bg-[#1d2a4a]'
                }`}
              >
                {dice}
              </button>
            );
          })}
        </div>

        {/* Optional Modifiers Bar */}
        <div className="flex items-center justify-between bg-[#13182e] px-4 py-2 rounded-xl border border-[#1a233a] text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-medium">Qtd:</span>
            {[1, 2, 3, 5].map(q => (
              <button
                key={q}
                onClick={() => setQuantity(q)}
                className={`w-6 h-6 rounded text-xs font-mono font-bold transition-all ${
                  quantity === q
                    ? 'bg-[#ff3b5c] text-white'
                    : 'bg-[#1a2038] text-slate-400 hover:text-white'
                }`}
              >
                {q}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="font-medium">Bônus:</span>
            <button
              onClick={() => setModifier(prev => prev - 1)}
              className="w-6 h-6 rounded bg-[#1a2038] text-slate-300 hover:bg-[#222c4a] font-mono font-bold"
            >
              -
            </button>
            <span className="font-mono text-xs font-bold text-slate-200">
              {modifier >= 0 ? `+${modifier}` : modifier}
            </span>
            <button
              onClick={() => setModifier(prev => prev + 1)}
              className="w-6 h-6 rounded bg-[#1a2038] text-slate-300 hover:bg-[#222c4a] font-mono font-bold"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
