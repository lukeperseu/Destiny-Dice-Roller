import React from 'react';
import { X, Shield, Lock, Zap, HelpCircle, Dices } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl space-y-5 custom-scrollbar text-slate-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Dices className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100">Regras & Mecânicas Ocultas</h2>
                <p className="text-xs text-slate-400">Como funciona a pesagem matemática e bloqueios</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-slate-300">
            {/* Rule 1: Secret 4th Die */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold">
                <Zap className="w-4 h-4" />
                <span>1. Mecânica do 4º Dado Oculto (d10, d20, d100)</span>
              </div>
              <p>
                Ao rolar d10, d20 ou d100, 4 dados idênticos são sorteados internamente. O 4º dado atua como regulador de probabilidade para extremos:
              </p>
              <ul className="list-disc list-inside text-slate-400 space-y-1 pl-2">
                <li><strong className="text-slate-200">d20:</strong> Se o 4º dado cair em <code className="text-rose-300">1, 2, 19 ou 20</code>, este resultado é retornado.</li>
                <li><strong className="text-slate-200">d10:</strong> Se o 4º dado cair em <code className="text-rose-300">1, 2, 9 ou 10</code>, este resultado é retornado.</li>
                <li><strong className="text-slate-200">d100:</strong> Se o 4º dado cair de <code className="text-rose-300">1 a 5</code> ou de <code className="text-rose-300">95 a 100</code>, este resultado é retornado.</li>
                <li><em className="text-amber-400/90 font-medium">Nota:</em> Estes números de gatilho nunca entram na fila de bloqueios nem são bloqueados.</li>
              </ul>
            </div>

            {/* Rule 2: FIFO Queue Blocking */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <Lock className="w-4 h-4" />
                <span>2. Média e Fila FIFO de Bloqueios</span>
              </div>
              <p>
                Caso o 4º dado não caia em um gatilho, a aplicação calcula a <strong className="text-slate-100">média dos 3 primeiros dados</strong> arredondada.
              </p>
              <ul className="list-disc list-inside text-slate-400 space-y-1 pl-2">
                <li>Cada número só pode aparecer até <strong className="text-slate-200">3 vezes</strong> via média. Na 3ª vez, ele entra na fila de bloqueados.</li>
                <li><strong className="text-slate-200">Limites da Fila (FIFO):</strong> d10 (5 bloqueados), d20 (10 bloqueados), d100 (50 bloqueados).</li>
                <li>Quando um novo número estoura o limite da fila, o número mais antigo é liberado automaticamente.</li>
              </ul>
            </div>

            {/* Rule 3: Secret d6 Inversion */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-purple-400 font-bold">
                <HelpCircle className="w-4 h-4" />
                <span>3. d6 Oculto - Mecânica Anti-Contagem (Inversão)</span>
              </div>
              <p>
                Para evitar que jogadores adivinhem estatisticamente quais números não cairão, um <strong className="text-slate-100">5º dado (d6 oculto)</strong> é girado em todas as rolagens complexas:
              </p>
              <p className="text-purple-300 font-medium">
                Se o d6 oculto cair em 6, ocorre uma inversão: números bloqueados passam a ser válidos e números válidos passam a ser bloqueados para aquela rolagem!
              </p>
            </div>
          </div>

          {/* Footer Action */}
          <div className="border-t border-slate-800 pt-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-950/50 transition-all"
            >
              Compreendi as Regras
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
