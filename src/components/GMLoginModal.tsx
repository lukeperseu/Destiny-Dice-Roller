import React, { useState, useEffect } from 'react';
import { Shield, User as UserIcon, X, LogOut, CheckCircle, AlertCircle, Loader2, Search, Link2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  loginAsGMWithGoogle,
  loginAsPlayerWithGoogle,
  fetchAllGMs,
  assignGMToPlayer,
  logoutUser,
  UserProfile
} from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onUserChange: (user: UserProfile | null) => void;
}

export const GMLoginModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
}) => {
  const [activeTab, setActiveTab] = useState<'gm' | 'player'>('player');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Player GM search state
  const [gmsList, setGmsList] = useState<UserProfile[]>([]);
  const [searchGmQuery, setSearchGmQuery] = useState('');
  const [loadingGms, setLoadingGms] = useState(false);
  const [isChangingGm, setIsChangingGm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (currentUser?.role === 'gm') {
        setActiveTab('gm');
      } else if (currentUser?.role === 'player') {
        setActiveTab('player');
      }
      loadGMs();
    }
  }, [isOpen, currentUser]);

  const loadGMs = async () => {
    setLoadingGms(true);
    try {
      const gms = await fetchAllGMs();
      setGmsList(gms);
    } catch (err) {
      console.error('Error loading GMs:', err);
    } finally {
      setLoadingGms(false);
    }
  };

  if (!isOpen) return null;

  const handleGMLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const profile = await loginAsGMWithGoogle();
      onUserChange(profile);
      onClose();
    } catch (err: any) {
      console.error('Google GM Login Error:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setError('A janela de login foi fechada antes da conclusão.');
      } else {
        setError('Falha ao autenticar com a conta Google. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const profile = await loginAsPlayerWithGoogle();
      onUserChange(profile);
      await loadGMs();
      // If player already has a GM, close modal or let them choose
      if (profile.gmUid) {
        onClose();
      }
    } catch (err: any) {
      console.error('Google Player Login Error:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setError('A janela de login foi fechada antes da conclusão.');
      } else {
        setError('Falha ao autenticar com a conta Google. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGM = async (selectedGm: UserProfile) => {
    if (!currentUser) return;
    setLoading(true);
    try {
      await assignGMToPlayer(currentUser.uid, selectedGm.uid, selectedGm.displayName || 'Mestre');
      const updatedProfile: UserProfile = {
        ...currentUser,
        gmUid: selectedGm.uid,
        gmDisplayName: selectedGm.displayName || 'Mestre'
      };
      onUserChange(updatedProfile);
      setIsChangingGm(false);
      onClose();
    } catch (err) {
      console.error('Error assigning GM:', err);
      setError('Não foi possível vincular a este Mestre. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logoutUser();
      onUserChange(null);
      setIsChangingGm(false);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredGms = gmsList.filter(gm => {
    const q = searchGmQuery.toLowerCase();
    const nameMatch = gm.displayName?.toLowerCase().includes(q) ?? false;
    const emailMatch = gm.email?.toLowerCase().includes(q) ?? false;
    return nameMatch || emailMatch;
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-[#101426] border border-[#232b4a] rounded-2xl max-w-md w-full shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-4 border-b border-[#1a233a] flex items-center justify-between bg-[#13182e] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-lg border ${
                activeTab === 'gm'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
              }`}>
                {activeTab === 'gm' ? <Shield className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-bold text-white text-base">
                  {currentUser ? 'Sua Conta' : 'Acessar a Mesa'}
                </h3>
                <p className="text-xs text-slate-400">
                  {currentUser
                    ? (currentUser.role === 'gm' ? 'Sessão de Mestre ativada' : 'Sessão de Jogador ativada')
                    : 'Faça login com Google para sincronizar suas rolagens'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Role Tabs (only when not logged in) */}
          {!currentUser && (
            <div className="flex border-b border-[#1a233a] bg-[#101426] p-1 gap-1 shrink-0">
              <button
                onClick={() => { setActiveTab('player'); setError(null); }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'player'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserIcon className="w-4 h-4" />
                <span>Sou Jogador</span>
              </button>

              <button
                onClick={() => { setActiveTab('gm'); setError(null); }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'gm'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Sou Mestre (GM)</span>
              </button>
            </div>
          )}

          {/* Modal Content Area */}
          <div className="p-6 space-y-5 text-sm text-slate-300 overflow-y-auto custom-scrollbar flex-1">
            {error && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* --- LOGGED IN USER STATE --- */}
            {currentUser ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#1a2038] border border-[#2d375e]">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'Usuário'}
                      className={`w-12 h-12 rounded-full border-2 object-cover ${
                        currentUser.role === 'gm' ? 'border-amber-500/60' : 'border-cyan-500/60'
                      }`}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border ${
                      currentUser.role === 'gm'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    }`}>
                      {currentUser.displayName?.[0] || 'U'}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white text-base truncate">
                        {currentUser.displayName || 'Jogador'}
                      </span>
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    </div>
                    <span className="text-xs text-slate-400 block truncate">
                      {currentUser.email}
                    </span>
                    <span className={`inline-block mt-1 text-[10px] uppercase font-mono px-2 py-0.5 rounded border ${
                      currentUser.role === 'gm'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                    }`}>
                      {currentUser.role === 'gm' ? 'Mestre Autenticado' : 'Jogador Autenticado'}
                    </span>
                  </div>
                </div>

                {/* If Player: show GM association */}
                {currentUser.role === 'player' && (
                  <div className="space-y-3 p-3.5 rounded-xl bg-[#13182e] border border-[#1a233a]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Link2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Mestre Vinculado:</span>
                      </span>

                      {currentUser.gmDisplayName && !isChangingGm && (
                        <button
                          onClick={() => setIsChangingGm(true)}
                          className="text-xs text-cyan-400 hover:underline font-semibold"
                        >
                          Trocar Mestre
                        </button>
                      )}
                    </div>

                    {currentUser.gmDisplayName && !isChangingGm ? (
                      <div className="flex items-center gap-2 font-bold text-white text-sm bg-[#1a2038] p-2.5 rounded-lg border border-[#232b4a]">
                        <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="truncate">{currentUser.gmDisplayName}</span>
                      </div>
                    ) : (
                      <div className="space-y-3 pt-1">
                        <p className="text-xs text-slate-400">
                          Selecione o seu Mestre na lista abaixo (Mestres que já fizeram login no sistema):
                        </p>

                        <div className="relative">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            placeholder="Buscar Mestre pelo nome ou email..."
                            value={searchGmQuery}
                            onChange={(e) => setSearchGmQuery(e.target.value)}
                            className="w-full bg-[#1a2038] border border-[#232b4a] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                          />
                        </div>

                        {loadingGms ? (
                          <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                            <span>Buscando Mestres cadastrados...</span>
                          </div>
                        ) : filteredGms.length === 0 ? (
                          <div className="py-3 text-center text-xs text-slate-500 italic bg-[#1a2038]/50 rounded-lg border border-[#232b4a]">
                            Nenhum Mestre encontrado. Peça para seu Mestre fazer o login inicial com Google!
                          </div>
                        ) : (
                          <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                            {filteredGms.map((gm) => (
                              <button
                                key={gm.uid}
                                onClick={() => handleSelectGM(gm)}
                                disabled={loading}
                                className="w-full text-left p-2.5 rounded-lg bg-[#1a2038] hover:bg-[#202744] border border-[#232b4a] hover:border-cyan-500/50 flex items-center justify-between gap-2 transition-all group"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {gm.photoURL ? (
                                    <img
                                      src={gm.photoURL}
                                      alt={gm.displayName || 'Mestre'}
                                      className="w-7 h-7 rounded-full border border-amber-500/50 object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <Shield className="w-5 h-5 text-amber-400 shrink-0" />
                                  )}
                                  <div className="min-w-0">
                                    <span className="font-bold text-white text-xs block truncate group-hover:text-cyan-300">
                                      {gm.displayName || 'Mestre'}
                                    </span>
                                    <span className="text-[10px] text-slate-400 block truncate">
                                      {gm.email}
                                    </span>
                                  </div>
                                </div>

                                <span className="text-[11px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/20 group-hover:bg-cyan-500/20">
                                  Vincular
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={handleLogout}
                    disabled={loading}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-rose-950/40 hover:text-rose-300 text-slate-300 border border-slate-700 hover:border-rose-500/40 font-semibold text-xs transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    ) : (
                      <>
                        <LogOut className="w-4 h-4" />
                        <span>Sair da Conta</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={onClose}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all"
                  >
                    Continuar para a Mesa
                  </button>
                </div>
              </div>
            ) : (
              /* --- NOT LOGGED IN STATE --- */
              <div className="space-y-4">
                {activeTab === 'gm' ? (
                  <>
                    <p className="text-slate-300 leading-relaxed text-xs sm:text-sm">
                      Conecte sua conta Google de Mestre para liberar acesso exclusivo ao Painel de Inspeção dos bastidores, controle FIFO e histórico sincronizado.
                    </p>

                    <button
                      onClick={handleGMLogin}
                      disabled={loading}
                      className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-3 active:scale-98 disabled:opacity-50"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-slate-700" />
                      ) : (
                        <>
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                          </svg>
                          <span>Entrar com Google como Mestre</span>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-slate-300 leading-relaxed text-xs sm:text-sm">
                      Conecte sua conta Google como Jogador. Suas rolagens serão compartilhadas em tempo real com o seu Mestre e indicadas com o seu nome.
                    </p>

                    <button
                      onClick={handlePlayerLogin}
                      disabled={loading}
                      className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-3 active:scale-98 disabled:opacity-50"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-slate-900" />
                      ) : (
                        <>
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                          </svg>
                          <span>Entrar com Google como Jogador</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
