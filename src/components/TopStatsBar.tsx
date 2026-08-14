import React from 'react';
import { DiceType, HistoryData } from '../types';
import { calculateAverage, calculateMedian } from '../utils/diceLogic';
import { BarChart2 } from 'lucide-react';

interface TopStatsBarProps {
  historyData: HistoryData;
  onOpenSidebar: () => void;
}

const DICE_ORDER: DiceType[] = ['d4', 'd6', 'd8', 'd10', 'd20', 'd100'];

export const TopStatsBar: React.FC<TopStatsBarProps> = ({
  historyData,
  onOpenSidebar,
}) => {
  return (
    <div className="lg:hidden bg-[#101426] border-b border-[#1a233a] px-3 py-2 flex items-center justify-between gap-2 z-20 shrink-0">
      <button
        onClick={onOpenSidebar}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ff3b5c]/20 hover:bg-[#ff3b5c]/30 text-[#ff3b5c] border border-[#ff3b5c]/40 text-xs font-bold shrink-0 transition-all active:scale-95"
      >
        <BarChart2 className="w-4 h-4" />
        <span>Estatísticas</span>
      </button>

      <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar no-scrollbar py-0.5 text-xs">
        {DICE_ORDER.map(diceType => {
          const logs = historyData[diceType] || [];
          const lastResult = logs.length > 0 ? logs[logs.length - 1].result : '-';
          const isD100 = diceType === 'd100';
          const metricVal = logs.length > 0
            ? (isD100 ? calculateMedian(logs) : calculateAverage(logs)).toFixed(1)
            : '0.0';

          return (
            <button
              key={diceType}
              onClick={onOpenSidebar}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#1a2038] hover:bg-[#202744] border border-[#232b4a] font-mono shrink-0 active:scale-95 transition-all"
              title={`Ver estatísticas do ${diceType}`}
            >
              <span className="font-bold text-[#ff3b5c]">{diceType}:</span>
              <span className="text-white font-bold">{lastResult}</span>
              <span className="text-[10px] text-[#00e676]">({metricVal})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
