import React, { useState, useEffect } from 'react';
import { ComplexDiceStates, DiceType, HistoryData, RollLog } from './types';
import { INITIAL_COMPLEX_STATES } from './utils/diceLogic';
import { Header } from './components/Header';
import { SidebarLogs } from './components/SidebarLogs';
import { TopStatsBar } from './components/TopStatsBar';
import { DiceRoller } from './components/DiceRoller';
import { GMInspector } from './components/GMInspector';
import { InfoModal } from './components/InfoModal';
import { GMLoginModal } from './components/GMLoginModal';
import {
  auth,
  db,
  onAuthStateChanged,
  UserProfile,
  saveRollToFirestore,
  subscribeToGMRolls,
  clearGMRollsFromFirestore
} from './lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

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
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [inspectedLog, setInspectedLog] = useState<RollLog | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Observe Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const profile = userSnap.data() as UserProfile;
            setCurrentUser(profile);
            if (profile.role === 'gm') {
              setIsGmMode(true);
            } else {
              setIsGmMode(false); // Players cannot enter GM mode
            }
          } else {
            const profile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              role: 'player',
            };
            setCurrentUser(profile);
            setIsGmMode(false);
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
        }
      } else {
        setCurrentUser(null);
        setIsGmMode(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Active GM UID for real-time table syncing
  const activeGmUid = currentUser?.role === 'gm'
    ? currentUser.uid
    : (currentUser?.role === 'player' ? currentUser.gmUid : null);

  // Real-time Firestore sync for shared rolls
  useEffect(() => {
    if (!activeGmUid) return;

    const unsubscribe = subscribeToGMRolls(activeGmUid, (serverRolls) => {
      const grouped: HistoryData = {
        d4: [],
        d6: [],
        d8: [],
        d10: [],
        d20: [],
        d100: [],
      };

      serverRolls.forEach((r) => {
        if (grouped[r.diceType]) {
          grouped[r.diceType].push(r);
        }
      });

      setHistoryData(grouped);
    });

    return () => unsubscribe();
  }, [activeGmUid]);

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
    const enrichedLog: RollLog = {
      ...rollLog,
      playerName: currentUser?.displayName || (currentUser?.role === 'gm' ? 'Mestre' : 'Jogador'),
      playerPhoto: currentUser?.photoURL || undefined,
      playerUid: currentUser?.uid,
      gmUid: activeGmUid || undefined,
    };

    setHistoryData(prev => ({
      ...prev,
      [enrichedLog.diceType]: [...(prev[enrichedLog.diceType] || []), enrichedLog],
    }));

    // If connected to a GM session, save to Firestore
    if (activeGmUid && currentUser) {
      saveRollToFirestore(enrichedLog, activeGmUid, currentUser);
    }
  };

  const handleClearDieHistory = (diceType: DiceType) => {
    setHistoryData(prev => ({
      ...prev,
      [diceType]: [],
    }));

    if (activeGmUid) {
      clearGMRollsFromFirestore(activeGmUid, diceType);
    }
  };

  const handleClearAllHistory = () => {
    setHistoryData(INITIAL_HISTORY);
    if (activeGmUid) {
      clearGMRollsFromFirestore(activeGmUid);
    }
  };

  const handleResetApp = () => {
    if (window.confirm('Tem certeza que deseja reiniciar todo o histórico e zerar os bloqueios?')) {
      setHistoryData(INITIAL_HISTORY);
      setComplexStates(INITIAL_COMPLEX_STATES);
      setInspectedLog(null);
      localStorage.removeItem('rpg_dice_history');
      localStorage.removeItem('rpg_dice_complex_states');
      if (activeGmUid) {
        clearGMRollsFromFirestore(activeGmUid);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0c0e18] text-slate-100 font-sans overflow-hidden select-none">
      {/* Top Header Bar */}
      <Header
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(prev => !prev)}
        isGmMode={isGmMode}
        onToggleGmMode={() => {
          if (currentUser?.role === 'player') {
            return; // Players are forbidden from GM Mode
          }
          if (!currentUser) {
            setIsAuthModalOpen(true);
          } else {
            setIsGmMode(prev => !prev);
          }
        }}
        onOpenInfo={() => setIsInfoOpen(true)}
        onResetApp={handleResetApp}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Mobile Top Stats Summary Bar (visible on narrow screens < lg) */}
      <TopStatsBar
        historyData={historyData}
        onOpenSidebar={() => setIsSidebarOpen(true)}
      />

      {/* Main Container Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left Sidebar Logs Panel */}
        <SidebarLogs
          historyData={historyData}
          onClearDieHistory={handleClearDieHistory}
          onClearAllHistory={handleClearAllHistory}
          onSelectLogToInspect={(log) => {
            if (currentUser?.role !== 'player') {
              setInspectedLog(log);
              if (!isGmMode) setIsGmMode(true);
            }
          }}
          isGmMode={isGmMode && currentUser?.role !== 'player'}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Center / Right Roller Arena */}
        <DiceRoller
          complexStates={complexStates}
          onStateUpdate={setComplexStates}
          onAddLog={handleAddLog}
          soundEnabled={soundEnabled}
          isGmMode={isGmMode && currentUser?.role !== 'player'}
          onSelectLogToInspect={(log) => {
            if (currentUser?.role !== 'player') {
              setInspectedLog(log);
            }
          }}
        />
      </div>

      {/* Bottom GM Inspector (visible ONLY if GM Mode is ON and user is NOT a Player) */}
      {isGmMode && currentUser?.role !== 'player' && (
        <GMInspector
          complexStates={complexStates}
          onStateUpdate={setComplexStates}
          onAddLog={handleAddLog}
          inspectedLog={inspectedLog}
          onCloseInspectedLog={() => setInspectedLog(null)}
        />
      )}

      {/* Auth Modal (GM & Player Login + GM Link) */}
      <GMLoginModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onUserChange={(user) => {
          setCurrentUser(user);
          if (user?.role === 'gm') {
            setIsGmMode(true);
          } else {
            setIsGmMode(false);
          }
        }}
      />

      {/* Info Rules Modal */}
      <InfoModal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
      />
    </div>
  );
}
