// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { useState } from 'react';
import { useGameStore } from './store/gameStore';
import WelcomeScreen from './components/screens/WelcomeScreen';
import SetupScreen from './components/screens/SetupScreen';
import GameScreen from './components/screens/GameScreen';
import GameEndScreen from './components/screens/GameEndScreen';
import RulesModal from './components/modals/RulesModal';
import { TribunalModal } from './components/modals/TribunalModal';
import './App.css';

function App() {
  const [showRules, setShowRules] = useState(false);
  const gamePhase = useGameStore((state) => state.gamePhase);
  const activeTribunal = useGameStore((state) => state.currentTribunal);

  return (
    <div className="app">
      {gamePhase === 'welcome' && (
        <WelcomeScreen onShowRules={() => { setShowRules(true); }} />
      )}

      {gamePhase === 'setup' && <SetupScreen />}

      {gamePhase === 'playing' && <GameScreen />}

      {gamePhase === 'ended' && <GameEndScreen />}

      {showRules && <RulesModal onClose={() => { setShowRules(false); }} />}

      {/* Tribunal Modal - Shows when there's an active tribunal */}
      {activeTribunal && <TribunalModal />}
    </div>
  );
}

export default App;
