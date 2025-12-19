import { useGameStore } from '../../store/gameStore';
import Board from '../board/Board';
import PlayerDashboard from '../player/PlayerDashboard';
import GameLog from '../game/GameLog';
import StoyPilferModal from '../modals/StoyPilferModal';
import './GameScreen.css';

export default function GameScreen() {
  const pendingAction = useGameStore((state) => state.pendingAction);
  const currentPlayer = useGameStore((state) => state.players[state.currentPlayerIndex]);
  const setTurnPhase = useGameStore((state) => state.setTurnPhase);

  const handleCloseStoyPilfer = () => {
    setTurnPhase('post-turn');
  };

  return (
    <div className="game-screen">
      <header className="game-header">
        <h1 className="game-title">COMMUNISTOPOLY</h1>
        <p className="game-tagline">"All players are equal, but some are more equal than others"</p>
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
    </div>
  );
}
