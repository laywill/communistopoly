import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { getPieceByType } from '../../data/pieces';
import { PropertyManagementModal } from '../modals/PropertyManagementModal';
import { ImprovementModal } from '../modals/ImprovementModal';
import './PlayerDashboard.css';

// Player colors for ownership indicators (matches PropertySpace.tsx)
const PLAYER_COLORS = [
  '#C41E3A', // Red
  '#1C3A5F', // Blue
  '#228B22', // Green
  '#D4A84B', // Gold
  '#DB7093', // Pink
  '#87CEEB', // Light Blue
];

export default function PlayerDashboard() {
  const players = useGameStore((state) => state.players);
  const currentPlayerIndex = useGameStore((state) => state.currentPlayerIndex);
  const turnPhase = useGameStore((state) => state.turnPhase);
  const endTurn = useGameStore((state) => state.endTurn);
  const finishMoving = useGameStore((state) => state.finishMoving);

  // Modal state
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showImproveModal, setShowImproveModal] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const handleEndTurn = () => {
    endTurn();
  };

  // Get player color for ownership indicator
  const getPlayerColor = (player: typeof players[0]) => {
    const playerIndex = players.findIndex((p) => p.id === player.id);
    return PLAYER_COLORS[playerIndex % PLAYER_COLORS.length];
  };

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

  // Check if player has any complete color groups
  const hasCompleteColorGroup = (player: typeof players[0]): boolean => {
    // Import PROPERTY_GROUPS to check complete sets
    const groups: Record<string, number[]> = {
      siberian: [1, 3],
      collective: [6, 8, 9],
      industrial: [11, 13, 14],
      ministry: [16, 18, 19],
      military: [21, 23, 24],
      media: [26, 27, 29],
      elite: [31, 32, 34],
      kremlin: [37, 39],
    };

    for (const [, groupSpaces] of Object.entries(groups)) {
      const ownsAll = groupSpaces.every((spaceId) =>
        player.properties.includes(spaceId.toString())
      );
      if (ownsAll) return true;
    }
    return false;
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
                <div
                  className="player-ownership-indicator"
                  style={{ backgroundColor: getPlayerColor(player) }}
                  title={`${player.name}'s ownership color`}
                />
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

                {isCurrentPlayer && !player.inGulag && (
                  <div className="player-actions">
                    {/* Property Management Actions - Available during pre-roll and post-turn */}
                    {(turnPhase === 'pre-roll' || turnPhase === 'post-turn') && (
                      <div className="property-actions">
                        <button
                          className="action-button secondary"
                          onClick={() => {
                            setSelectedPlayerId(player.id);
                            setShowPropertyModal(true);
                          }}
                          disabled={player.properties.length === 0}
                          title={player.properties.length === 0 ? 'No properties to manage' : 'Manage your properties'}
                        >
                          📋 MANAGE PROPERTIES
                        </button>
                        <button
                          className="action-button secondary"
                          onClick={() => {
                            setSelectedPlayerId(player.id);
                            setShowImproveModal(true);
                          }}
                          disabled={!hasCompleteColorGroup(player)}
                          title={!hasCompleteColorGroup(player) ? 'Need complete color group to improve' : 'Improve your properties'}
                        >
                          🏭 IMPROVE
                        </button>
                      </div>
                    )}

                    {/* Turn Control Actions */}
                    {turnPhase === 'moving' && (
                      <button className="action-button" onClick={finishMoving}>
                        FINISH MOVING
                      </button>
                    )}
                    {turnPhase === 'post-turn' && (
                      <button className="action-button primary" onClick={handleEndTurn}>
                        END TURN
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      {showPropertyModal && selectedPlayerId && (
        <PropertyManagementModal
          playerId={selectedPlayerId}
          onClose={() => {
            setShowPropertyModal(false);
            setSelectedPlayerId(null);
          }}
        />
      )}

      {showImproveModal && selectedPlayerId && (
        <ImprovementModal
          playerId={selectedPlayerId}
          onClose={() => {
            setShowImproveModal(false);
            setSelectedPlayerId(null);
          }}
        />
      )}
    </div>
  );
}
