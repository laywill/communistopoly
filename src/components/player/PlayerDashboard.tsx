import { useGameStore } from '../../store/gameStore';
import { getPieceByType } from '../../data/pieces';
import './PlayerDashboard.css';

export default function PlayerDashboard() {
  const players = useGameStore((state) => state.players);
  const currentPlayerIndex = useGameStore((state) => state.currentPlayerIndex);

  // Render rank stars
  const renderRankStars = (rank: string) => {
    const rankLevels: Record<string, number> = {
      proletariat: 0,
      partyMember: 1,
      commissar: 2,
      innerCircle: 3,
    };

    const level = rankLevels[rank] || 0;
    const stars = [];

    for (let i = 0; i < 4; i++) {
      stars.push(
        <span key={i} className={`rank-star ${i <= level ? 'filled' : 'empty'}`}>
          ★
        </span>
      );
    }

    return <div className="rank-stars">{stars}</div>;
  };

  // Render rank name
  const getRankName = (rank: string) => {
    const rankNames: Record<string, string> = {
      proletariat: 'Proletariat',
      partyMember: 'Party Member',
      commissar: 'Commissar',
      innerCircle: 'Inner Circle',
    };
    return rankNames[rank] || rank;
  };

  // Get player status
  const getPlayerStatus = (player: typeof players[0]) => {
    if (player.isEliminated) return 'Eliminated';
    if (player.inGulag) return 'In Gulag';
    return 'In Play';
  };

  // Filter out Stalin from display
  const nonStalinPlayers = players.filter(p => !p.isStalin);

  return (
    <div className="player-dashboard">
      <div className="players-grid">
        {nonStalinPlayers.map((player, index) => {
          const pieceData = player.piece ? getPieceByType(player.piece) : null;
          const isCurrentPlayer = index + 1 === currentPlayerIndex; // +1 because Stalin is index 0

          return (
            <div
              key={player.id}
              className={`player-card ${isCurrentPlayer ? 'current-player' : ''} ${player.inGulag ? 'in-gulag' : ''}`}
            >
              <div className="player-card-header">
                <span className="player-piece-icon">{pieceData?.icon || '?'}</span>
                <span className="player-name">{player.name}</span>
                {isCurrentPlayer && <span className="current-badge">CURRENT</span>}
              </div>

              <div className="player-card-body">
                <div className="player-stat">
                  <label>RANK:</label>
                  <div className="stat-value">
                    {renderRankStars(player.rank)}
                    <span className="rank-name">{getRankName(player.rank)}</span>
                  </div>
                </div>

                <div className="player-stat">
                  <label>RUBLES:</label>
                  <span className="stat-value rubles">₽{player.rubles}</span>
                </div>

                <div className="player-stat">
                  <label>PROPERTIES:</label>
                  <span className="stat-value">{player.properties.length}</span>
                </div>

                <div className="player-stat">
                  <label>STATUS:</label>
                  <span className={`stat-value status status-${getPlayerStatus(player).toLowerCase().replace(' ', '-')}`}>
                    {getPlayerStatus(player)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
