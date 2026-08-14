import React from 'react';
import { Volume2, VolumeX, Shield, Info, Dices, RotateCcw } from 'lucide-react';

interface HeaderProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  isGmMode: boolean;
  onToggleGmMode: () => void;
  onOpenInfo: () => void;
  onResetApp: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  soundEnabled,
  onToggleSound,
  isGmMode,
  onToggleGmMode,
  onOpenInfo,
  onResetApp,
}) => {
  return (
    <header className="w-full bg-[#101426] border-b border-[#1a233a] px-4 py-3 flex items-center justify-between shrink-0 shadow-md">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-rose-500 to-amber-600 rounded-xl shadow-lg shadow-rose-950/40 text-white">
          <Dices className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-extrabold text-slate-100 tracking-wide text-base sm:text-lg flex items-center gap-2">
            RPG Secret Dice
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
              Mechanics
            </span>
          </h1>
          <p className="text-xs text-slate-400 hidden sm:block">
            Rolador com mecânica oculta de 4º dado, bloqueio FIFO e d6 de inversão
          </p>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-2">
        {/* GM Mode Toggle */}
        <button
          onClick={onToggleGmMode}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
            isGmMode
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-950/30'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
          }`}
          title="Modo Mestre / GM: Exibe fila de bloqueio e rolagem secreta em tempo real"
        >
          <Shield className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Modo Mestre</span>
        </button>

        {/* Sound Toggle */}
        <button
          onClick={onToggleSound}
          className={`p-2 rounded-lg text-xs border transition-all ${
            soundEnabled
              ? 'bg-slate-900 text-emerald-400 border-slate-800 hover:bg-slate-800'
              : 'bg-slate-900 text-slate-500 border-slate-800 hover:bg-slate-800'
          }`}
          title={soundEnabled ? 'Sons ativados' : 'Sons desativados'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Info Rules Modal Button */}
        <button
          onClick={onOpenInfo}
          className="p-2 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white transition-all"
          title="Regras e Funcionamento Oculto"
        >
          <Info className="w-4 h-4" />
        </button>

        {/* Reset App */}
        <button
          onClick={onResetApp}
          className="p-2 rounded-lg bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-rose-400 transition-all"
          title="Reiniciar Estado e Bloqueios"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
