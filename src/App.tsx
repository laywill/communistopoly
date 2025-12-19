import { useState } from 'react';
import { useGameStore } from './store/gameStore';
import WelcomeScreen from './components/screens/WelcomeScreen';
import SetupScreen from './components/screens/SetupScreen';
import GameScreen from './components/screens/GameScreen';
import RulesModal from './components/modals/RulesModal';
import './App.css';

function App() {
  const [showRules, setShowRules] = useState(false);
  const gamePhase = useGameStore((state) => state.gamePhase);

  return (
    <div className="app">
      {gamePhase === 'welcome' && (
        <WelcomeScreen onShowRules={() => setShowRules(true)} />
      )}

      {gamePhase === 'setup' && <SetupScreen />}

      {gamePhase === 'playing' && <GameScreen />}

      {gamePhase === 'ended' && (
        <div className="end-screen">
          <h1>Game Over</h1>
          <p>(End screen coming in later milestone)</p>
        </div>
      )}

      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
    </div>
  );
}

export default App;
