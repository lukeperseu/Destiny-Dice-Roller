import React, { useState, useEffect } from 'react';
import { ComplexDiceStates, DiceType, HistoryData, RollLog } from './types';
import { INITIAL_COMPLEX_STATES } from './utils/diceLogic';
import { Header } from './components/Header';
import { SidebarLogs } from './components/SidebarLogs';
import { TopStatsBar } from './components/TopStatsBar';
import { DiceRoller } from './components/DiceRoller';
import { GMInspector } from './components/GMInspector';
import { InfoModal } from './components/InfoModal';

const INITIAL_HISTORY: HistoryData = {
  d4: [],
  d6: [],
  d8: [],
  d10: [],
  d20: [],
  d100: [],
};

export default function App() {
  // Load state from localStorage if available
  const [historyData, setHistoryData] = useState<HistoryData>(() => {
    try {
      const saved = localStorage.getItem('rpg_dice_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse history from localStorage', e);
    }
    return INITIAL_HISTORY;
  });

  const [complexStates, setComplexStates] = useState<ComplexDiceStates>(() => {
    try {
      const saved = localStorage.getItem('rpg_dice_complex_states');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse complex states from localStorage', e);
    }
    return INITIAL_COMPLEX_STATES;
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isGmMode, setIsGmMode] = useState<boolean>(false);
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false);
  const [inspectedLog, setInspectedLog] = useState<RollLog | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('rpg_dice_history', JSON.stringify(historyData));
    } catch (e) {
      console.warn('Failed to save history to localStorage', e);
    }
  }, [historyData]);

  useEffect(() => {
    try {
      localStorage.setItem('rpg_dice_complex_states', JSON.stringify(complexStates));
    } catch (e) {
      console.warn('Failed to save complex states to localStorage', e);
    }
  }, [complexStates]);

  // Handlers
  const handleAddLog = (rollLog: RollLog) => {
    setHistoryData(prev => ({
      ...prev,
      [rollLog.diceType]: [...(prev[rollLog.diceType] || []), rollLog],
    }));
  };

  const handleClearDieHistory = (diceType: DiceType) => {
    setHistoryData(prev => ({
      ...prev,
      [diceType]: [],
    }));
  };

  const handleClearAllHistory = () => {
    setHistoryData(INITIAL_HISTORY);
  };

  const handleResetApp = () => {
    if (window.confirm('Tem certeza que deseja reiniciar todo o histórico e zerar os bloqueios?')) {
      setHistoryData(INITIAL_HISTORY);
      setComplexStates(INITIAL_COMPLEX_STATES);
      setInspectedLog(null);
      localStorage.removeItem('rpg_dice_history');
      localStorage.removeItem('rpg_dice_complex_states');
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0c0e18] text-slate-100 font-sans overflow-hidden select-none">
      {/* Top Header Bar */}
      <Header
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(prev => !prev)}
        isGmMode={isGmMode}
        onToggleGmMode={() => setIsGmMode(prev => !prev)}
        onOpenInfo={() => setIsInfoOpen(true)}
        onResetApp={handleResetApp}
      />

      {/* Mobile Top Stats Summary Bar (visible on narrow screens < lg) */}
      <TopStatsBar
        historyData={historyData}
        onOpenSidebar={() => setIsSidebarOpen(true)}
      />

      {/* Main Container Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left Sidebar Logs Panel (6 cards: d4, d6, d8, d10, d20, d100) */}
        <SidebarLogs
          historyData={historyData}
          onClearDieHistory={handleClearDieHistory}
          onClearAllHistory={handleClearAllHistory}
          onSelectLogToInspect={(log) => {
            setInspectedLog(log);
            if (!isGmMode) setIsGmMode(true);
          }}
          isGmMode={isGmMode}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Center / Right Roller Arena */}
        <DiceRoller
          complexStates={complexStates}
          onStateUpdate={setComplexStates}
          onAddLog={handleAddLog}
          soundEnabled={soundEnabled}
          isGmMode={isGmMode}
          onSelectLogToInspect={(log) => setInspectedLog(log)}
        />
      </div>

      {/* Bottom GM Inspector (visible when GM Mode is ON) */}
      {isGmMode && (
        <GMInspector
          complexStates={complexStates}
          onStateUpdate={setComplexStates}
          onAddLog={handleAddLog}
          inspectedLog={inspectedLog}
          onCloseInspectedLog={() => setInspectedLog(null)}
        />
      )}

      {/* Info Rules Modal */}
      <InfoModal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
      />
    </div>
  );
}
