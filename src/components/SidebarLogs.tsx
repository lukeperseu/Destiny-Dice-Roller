import React, { useState } from 'react';
import { DiceType, HistoryData, RollLog } from '../types';
import { calculateAverage, calculateMedian } from '../utils/diceLogic';
import { Trash2, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarLogsProps {
  historyData: HistoryData;
  onClearDieHistory: (diceType: DiceType) => void;
  onClearAllHistory: () => void;
  onSelectLogToInspect?: (log: RollLog) => void;
  isGmMode?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

const DICE_ORDER: DiceType[] = ['d4', 'd6', 'd8', 'd10', 'd20', 'd100'];

export const SidebarLogs: React.FC<SidebarLogsProps> = ({
  historyData,
  onClearDieHistory,
  onClearAllHistory,
  onSelectLogToInspect,
  isGmMode = false,
  isOpen = false,
  onClose,
}) => {
  const [expandedDie, setExpandedDie] = useState<DiceType | null>(null);

  const toggleExpand = (diceType: DiceType) => {
    setExpandedDie(prev => (prev === diceType ? null : diceType));
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <aside
        className={`bg-[#13182e] border-r border-[#1a233a] flex flex-col h-full shrink-0 shadow-2xl transition-transform duration-300 ease-in-out z-50
          fixed inset-y-0 left-0 w-80 max-w-[85vw] ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }
          lg:static lg:translate-x-0 lg:w-96 lg:z-auto
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#1a233a] flex items-center justify-between bg-[#101426] relative">
          {/* Mobile Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all z-10"
              title="Fechar estatísticas"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="w-full text-center">
            <h2 className="text-base font-extrabold tracking-widest text-[#ff3b5c] uppercase">
              ESTATÍSTICAS
            </h2>
          </div>

          <button
            onClick={onClearAllHistory}
            title="Limpar todos os logs"
            className="absolute right-3 p-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all z-10"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* 6 Dice Cards List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {DICE_ORDER.map(diceType => {
            const logs = historyData[diceType] || [];
            const count = logs.length;
            const isD100 = diceType === 'd100';

            const metricLabel = isD100 ? 'Mediana' : 'Média';
            const metricValue = isD100 ? calculateMedian(logs) : calculateAverage(logs);

            const isExpanded = expandedDie === diceType;

            // History numbers string separated by commas (like in screenshot)
            const results = logs.map(l => l.result);
            const historyString = results.length > 0
              ? results.join(', ')
              : 'Nenhuma rolagem';

            return (
              <div
                key={diceType}
                className="rounded-lg transition-all border-l-4 border-l-[#ff3b5c] bg-[#1a2038] hover:bg-[#202744] border-y border-r border-[#232b4a] shadow-md"
              >
                {/* Card Header Summary */}
                <div
                  onClick={() => toggleExpand(diceType)}
                  className="p-3 cursor-pointer select-none space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-base tracking-wide">{diceType}</span>

                    {/* Metric Display */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-[#00e676]">
                        {metricLabel}: {count === 0 ? '0.0' : metricValue.toFixed(1)}
                      </span>
                      <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </div>

                  {/* Comma separated history list as shown in screenshot */}
                  <div className="text-[11px] font-mono text-slate-400 truncate opacity-80">
                    {historyString}
                  </div>
                </div>

                {/* Expanded Card Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-[#232b4a] p-3 bg-[#13182e]/80 rounded-b-lg space-y-3"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Histórico detalhado ({logs.length})</span>
                        {count > 0 && (
                          <button
                            onClick={() => onClearDieHistory(diceType)}
                            className="text-[11px] text-[#ff3b5c] hover:underline flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Limpar {diceType}
                          </button>
                        )}
                      </div>

                      {logs.length === 0 ? (
                        <div className="text-xs text-slate-500 text-center py-2 italic">
                          Nenhuma rolagem efetuada.
                        </div>
                      ) : (
                        <div className="max-h-40 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                          {logs.slice().reverse().map((log, index) => (
                            <div
                              key={log.id}
                              onClick={() => {
                                onSelectLogToInspect?.(log);
                                if (window.innerWidth < 1024 && onClose) onClose();
                              }}
                              className="p-1.5 rounded bg-[#1a2038] hover:bg-[#232b4a] border border-[#2d375e] flex items-center justify-between text-xs cursor-pointer transition-all"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-500 font-mono">
                                  #{logs.length - index}
                                </span>
                                <span className="font-mono font-bold text-white text-sm">
                                  {log.result}
                                </span>
                                {log.isTriggerResult && (
                                  <span className="text-[9px] bg-[#ff3b5c]/20 text-[#ff3b5c] border border-[#ff3b5c]/40 px-1 rounded">
                                    4º Dado
                                  </span>
                                )}
                                {log.isInverted && (
                                  <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-1 rounded">
                                    Invertido
                                  </span>
                                )}
                              </div>

                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
};
