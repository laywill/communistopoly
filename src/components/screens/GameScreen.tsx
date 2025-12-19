import { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import Board from '../board/Board';
import PlayerDashboard from '../player/PlayerDashboard';
import GameLog from '../game/GameLog';
import StoyPilferModal from '../modals/StoyPilferModal';
import ExitConfirmModal from '../modals/ExitConfirmModal';
import './GameScreen.css';

export default function GameScreen() {
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const pendingAction = useGameStore((state) => state.pendingAction);
  const currentPlayer = useGameStore((state) => state.players[state.currentPlayerIndex]);
  const setTurnPhase = useGameStore((state) => state.setTurnPhase);
  const resetGame = useGameStore((state) => state.resetGame);

  const handleCloseStoyPilfer = () => {
    setTurnPhase('post-turn');
  };

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
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resetGame]);

  return (
    <div className="game-screen">
      <header className="game-header">
        <div className="game-header-content">
          <h1 className="game-title">COMMUNISTOPOLY</h1>
          <p className="game-tagline">"All players are equal, but some are more equal than others"</p>
        </div>
        <button className="menu-button" onClick={() => setShowExitConfirm(true)}>
          ☭ MENU
        </button>
      </header>

      <div className="game-layout">
        <div className="board-section">
          <Board />
        </div>

        <div className="info-section">
          <div className="stalin-panel-placeholder">
            <p>Stalin's Panel</p>
            <p>(Coming in Milestone 6)</p>
          </div>

          <div className="game-log-section">
            <GameLog />
          </div>
        </div>
      </div>

      <div className="dashboards-section">
        <PlayerDashboard />
      </div>

      {/* Modals */}
      {pendingAction?.type === 'stoy-pilfer' && currentPlayer && (
        <StoyPilferModal
          playerId={currentPlayer.id}
          onClose={handleCloseStoyPilfer}
        />
      )}

      <ExitConfirmModal
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        onConfirm={handleExitConfirm}
      />
    </div>
  );
}
