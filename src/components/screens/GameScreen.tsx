import Board from '../board/Board';
import PlayerDashboard from '../player/PlayerDashboard';
import './GameScreen.css';

export default function GameScreen() {
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

          <div className="game-log-placeholder">
            <p>Game Log</p>
            <p>(Coming soon)</p>
          </div>
        </div>
      </div>

      <div className="dashboards-section">
        <PlayerDashboard />
      </div>
    </div>
  );
}
