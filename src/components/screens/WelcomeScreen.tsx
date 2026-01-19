// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { useGameStore } from '../../store/gameStore';
import './WelcomeScreen.css';

interface WelcomeScreenProps {
  onShowRules: () => void;
}

export default function WelcomeScreen({ onShowRules }: WelcomeScreenProps) {
  const { setGamePhase } = useGameStore();
  const savedGame = useGameStore((state) => state.players.length > 0 && state.gamePhase !== 'welcome');

  const handleNewGame = () => {
    useGameStore.getState().startNewGame();
  };

  const handleContinueGame = () => {
    setGamePhase('playing');
  };

  return (
    <div className="welcome-screen">
      <div className="welcome-container">
        <div className="welcome-header">
          <span className="hammer-sickle-symbol">☭</span>
          <span className="welcome-title">COMMUNISTOPOLY</span>
          <span className="hammer-sickle-symbol">☭</span>
        </div>

        <p className="welcome-subtitle">
          &quot;All players are equal, but some players are more equal than others.&quot;
        </p>

        <div className="welcome-buttons">
          <button
            className="welcome-btn welcome-btn-primary"
            onClick={handleNewGame}
          >
            NEW GAME
          </button>

          <button
            className="welcome-btn welcome-btn-secondary"
            onClick={handleContinueGame}
            disabled={!savedGame}
          >
            CONTINUE GAME
          </button>

          <button
            className="welcome-btn welcome-btn-secondary"
            onClick={onShowRules}
          >
            HOW TO PLAY
          </button>
        </div>

        <div className="welcome-footer">
          Glory to the Motherland. Glory to Stalin.
        </div>
      </div>
    </div>
  );
}
