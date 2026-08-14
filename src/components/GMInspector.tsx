import React, { useState } from 'react';
import { ComplexDiceStates, ComplexDiceType, RollLog } from '../types';
import { DiceIcon } from './DiceIcon';
import { Shield, Eye, Lock, Unlock, Play, X, Zap, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { rollComplexDice } from '../utils/diceLogic';

interface GMInspectorProps {
  complexStates: ComplexDiceStates;
  onStateUpdate: (newStates: ComplexDiceStates) => void;
  onAddLog: (log: RollLog) => void;
  inspectedLog: RollLog | null;
  onCloseInspectedLog: () => void;
}

export const GMInspector: React.FC<GMInspectorProps> = ({
  complexStates,
  onStateUpdate,
  onAddLog,
  inspectedLog,
  onCloseInspectedLog,
}) => {
  const [selectedComplexDie, setSelectedComplexDie] = useState<ComplexDiceType>('d20');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const state = complexStates[selectedComplexDie];

  // Run simulation of N rolls
  const runSimulation = (count: number) => {
    setIsSimulating(true);
    let tempStates = { ...complexStates };

    setTimeout(() => {
      for (let i = 0; i < count; i++) {
        const { rollLog, updatedStates } = rollComplexDice(selectedComplexDie, tempStates);
        tempStates = updatedStates;
        onAddLog(rollLog);
      }
      onStateUpdate(tempStates);
      setIsSimulating(false);
    }, 100);
  };

  return (
    <div className="w-full bg-amber-950/20 border-t border-amber-500/30 p-4 shrink-0 backdrop-blur-md">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* GM Inspector Header */}
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm uppercase tracking-wider">
            <Shield className="w-4 h-4" />
            <span>Painel do Mestre (GM Inspector - Mecânicas Ocultas)</span>
          </div>

          <div className="flex items-center gap-2">
            {(['d10', 'd20', 'd100'] as ComplexDiceType[]).map(die => (
              <button
                key={die}
                onClick={() => setSelectedComplexDie(die)}
                className={`px-2.5 py-1 rounded text-xs font-mono font-bold border transition-all ${
                  selectedComplexDie === die
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                    : 'bg-slate-900/80 text-amber-400/70 border-amber-500/20 hover:bg-slate-800'
                }`}
              >
                {die}
              </button>
            ))}
          </div>
        </div>

        {/* Inspected Log Modal / Drawer (if selected) */}
        <AnimatePresence>
          {inspectedLog && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-amber-500/50 rounded-xl p-3 shadow-xl relative"
            >
              <button
                onClick={onCloseInspectedLog}
                className="absolute top-2 right-2 p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" /> Auditoria da Rolagem #{inspectedLog.id.slice(-6)} ({inspectedLog.diceType})
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Resultado Exibido</span>
                  <span className="font-bold text-emerald-400 text-base">{inspectedLog.result}</span>
                </div>

                {inspectedLog.secretDice ? (
                  <>
                    <div className="bg-slate-950 p-2 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Dados 1, 2, 3</span>
                      <span className="text-slate-200">
                        {inspectedLog.secretDice.d1}, {inspectedLog.secretDice.d2}, {inspectedLog.secretDice.d3}
                      </span>
                    </div>

                    <div className="bg-slate-950 p-2 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">4º Dado (Gatilho)</span>
                      <span className={`font-bold ${inspectedLog.isTriggerResult ? 'text-rose-400' : 'text-slate-400'}`}>
                        {inspectedLog.secretDice.d4Secret} {inspectedLog.isTriggerResult ? '🎯' : ''}
                      </span>
                    </div>

                    <div className="bg-slate-950 p-2 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">d6 Oculto (Inversão)</span>
                      <span className={`font-bold ${inspectedLog.isInverted ? 'text-purple-400' : 'text-slate-400'}`}>
                        {inspectedLog.secretDice.d6Inversion} {inspectedLog.isInverted ? '⚡ INVERTIDO' : ''}
                      </span>
                    </div>

                    <div className="bg-slate-950 p-2 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Média de (d1,d2,d3)</span>
                      <span className="text-slate-300">{inspectedLog.averageOf3 ?? '-'}</span>
                    </div>
                  </>
                ) : (
                  <div className="col-span-4 bg-slate-950 p-2 rounded text-slate-400 italic">
                    Rolagem simples sem dados secretos.
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live Block Queue FIFO Monitor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          {/* Queue box */}
          <div className="bg-slate-950/80 p-3 rounded-xl border border-amber-500/20 space-y-2">
            <div className="flex items-center justify-between text-amber-300 font-bold">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                Fila FIFO de Números Bloqueados ({state.blockedQueue.length} / {state.maxBlocked})
              </span>
              <span className="text-[10px] text-slate-500">Limite: {state.maxBlocked}</span>
            </div>

            {state.blockedQueue.length === 0 ? (
              <div className="text-slate-500 text-center py-3 italic bg-slate-900/50 rounded">
                Nenhum número bloqueado no momento para {selectedComplexDie}.
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar p-1">
                {state.blockedQueue.map((num, idx) => (
                  <span
                    key={`${num}-${idx}`}
                    className="px-2 py-1 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold flex items-center gap-1"
                  >
                    <span>{num}</span>
                    {idx === 0 && (
                      <span className="text-[9px] bg-rose-500/30 px-1 rounded text-rose-200">Próx. Saída</span>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Triggers and Simulation controls */}
          <div className="bg-slate-950/80 p-3 rounded-xl border border-amber-500/20 space-y-2.5">
            <div className="text-amber-300 font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Gatilhos do 4º Dado ({selectedComplexDie})
              </span>
              <span className="text-[10px] text-slate-400">Nunca Bloqueiam</span>
            </div>

            <div className="flex flex-wrap gap-1">
              {state.triggers.map(t => (
                <span key={t} className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold">
                  {t}
                </span>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Simular Rolagens Automáticas:</span>
              <div className="flex items-center gap-1.5">
                {[10, 50, 100].map(cnt => (
                  <button
                    key={cnt}
                    onClick={() => runSimulation(cnt)}
                    disabled={isSimulating}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/30 text-[11px] flex items-center gap-1 disabled:opacity-50"
                  >
                    {isSimulating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                    <span>+{cnt}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
