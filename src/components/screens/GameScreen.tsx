// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import Board from '../board/Board';
import PlayerDashboard from '../player/PlayerDashboard';
import GameLog from '../game/GameLog';
import StalinPanel from '../stalin/StalinPanel';
import { PendingActionHandler } from '../modals/PendingActionHandler';
import ExitConfirmModal from '../modals/ExitConfirmModal';
import './GameScreen.css';

export default function GameScreen() {
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const resetGame = useGameStore((state) => state.resetGame);

  const handleExitConfirm = () => {
    resetGame();
    setShowExitConfirm(false);
  };

  // Dev quick-reset keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+R to quick reset (different from browser refresh)
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        if (confirm('Quick reset game? All progress will be lost.')) {
          resetGame();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => { window.removeEventListener('keydown', handleKeyDown); };
  }, [resetGame]);

  return (
    <div className="game-screen">
      <header className="game-header">
        <div className="game-header-content">
          <h1 className="game-title">COMMUNISTOPOLY</h1>
          <p className="game-tagline">&quot;All players are equal, but some are more equal than others&quot;</p>
        </div>
        <button className="menu-button" onClick={() => { setShowExitConfirm(true); }}>
          ☭ MENU
        </button>
      </header>

      <div className="game-layout">
        <div className="stalin-wrapper">
          <div className="stalin-panel-section">
            <StalinPanel />
          </div>
        </div>

        <div className="board-section">
          <Board />
        </div>

        <div className="info-section">
          <div className="game-log-section">
            <GameLog />
          </div>
        </div>
      </div>

      <div className="dashboards-section">
        <PlayerDashboard />
      </div>

      {/* Modals */}
      <PendingActionHandler />

      <ExitConfirmModal
        isOpen={showExitConfirm}
        onClose={() => { setShowExitConfirm(false); }}
        onConfirm={handleExitConfirm}
      />
    </div>
  );
}
