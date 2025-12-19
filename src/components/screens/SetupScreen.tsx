import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { PieceType } from '../../types/game';
import { PIECES, getAvailablePieces } from '../../data/pieces';
import './SetupScreen.css';

interface PlayerSetup {
  name: string;
  piece: PieceType | null;
  isStalin: boolean;
}

export default function SetupScreen() {
  const [playerCount, setPlayerCount] = useState<number>(3);
  const [players, setPlayers] = useState<PlayerSetup[]>([
    { name: '', piece: null, isStalin: true },  // Stalin
    { name: '', piece: null, isStalin: false },
    { name: '', piece: null, isStalin: false },
  ]);

  const { initializePlayers, setGamePhase } = useGameStore();

  // Update player count
  const handlePlayerCountChange = (count: number) => {
    setPlayerCount(count);
    const newPlayers: PlayerSetup[] = [
      { name: players[0].name, piece: null, isStalin: true }, // Keep Stalin
    ];

    for (let i = 1; i < count; i++) {
      if (players[i]) {
        newPlayers.push(players[i]);
      } else {
        newPlayers.push({ name: '', piece: null, isStalin: false });
      }
    }

    setPlayers(newPlayers);
  };

  // Update player name
  const handleNameChange = (index: number, name: string) => {
    const newPlayers = [...players];
    newPlayers[index] = { ...newPlayers[index], name };
    setPlayers(newPlayers);
  };

  // Update player piece
  const handlePieceChange = (index: number, piece: PieceType) => {
    const newPlayers = [...players];
    newPlayers[index] = { ...newPlayers[index], piece };
    setPlayers(newPlayers);
  };

  // Validation
  const isValid = () => {
    // All players must have names
    if (players.some(p => !p.name.trim())) return false;

    // All non-Stalin players must have pieces
    if (players.filter(p => !p.isStalin).some(p => !p.piece)) return false;

    // No duplicate pieces
    const nonStalinPieces = players.filter(p => !p.isStalin).map(p => p.piece);
    const uniquePieces = new Set(nonStalinPieces);
    if (uniquePieces.size !== nonStalinPieces.length) return false;

    return true;
  };

  // Start game
  const handleBeginGame = () => {
    if (!isValid()) return;

    initializePlayers(players);
    setGamePhase('playing');
  };

  // Get available pieces for a specific player
  const getAvailablePiecesForPlayer = (currentIndex: number): PieceType[] => {
    const usedPieces = players
      .map((p, i) => (i !== currentIndex && !p.isStalin ? p.piece : null))
      .filter((p): p is PieceType => p !== null);

    return getAvailablePieces(usedPieces).map(p => p.type);
  };

  return (
    <div className="setup-screen">
      <div className="setup-container">
        <h1 className="setup-title">REGISTER THE PROLETARIAT</h1>

        {/* Player Count Selection */}
        <div className="player-count-section">
          <label>Number of Comrades:</label>
          <div className="player-count-buttons">
            {[3, 4, 5, 6].map((count) => (
              <button
                key={count}
                className={`count-btn ${playerCount === count ? 'active' : ''}`}
                onClick={() => handlePlayerCountChange(count)}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        {/* Player Registration */}
        <div className="players-list">
          {players.map((player, index) => (
            <div key={index} className="player-card">
              {player.isStalin ? (
                <div className="player-header stalin-header">
                  <span>⭐</span>
                  <span>COMRADE {index + 1} (STALIN - Game Master)</span>
                  <span>⭐</span>
                </div>
              ) : (
                <div className="player-header">
                  COMRADE {index + 1}
                </div>
              )}

              <div className="player-inputs">
                <div className="input-group">
                  <label>Name:</label>
                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) => handleNameChange(index, e.target.value)}
                    placeholder="Enter name..."
                    className="player-input"
                  />
                </div>

                {!player.isStalin && (
                  <div className="input-group">
                    <label>Piece:</label>
                    <select
                      value={player.piece || ''}
                      onChange={(e) => handlePieceChange(index, e.target.value as PieceType)}
                      className="player-select"
                    >
                      <option value="">Select a piece...</option>
                      {getAvailablePiecesForPlayer(index).map((pieceType) => {
                        const pieceData = PIECES.find(p => p.type === pieceType);
                        return (
                          <option key={pieceType} value={pieceType}>
                            {pieceData?.icon} {pieceData?.name} - {pieceData?.shortAbility}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                {player.isStalin && (
                  <div className="stalin-note">
                    ★ This player will control the game as Stalin
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Begin Button */}
        <div className="setup-footer">
          <button
            className="begin-btn"
            onClick={handleBeginGame}
            disabled={!isValid()}
          >
            BEGIN THE REVOLUTION
          </button>
        </div>
      </div>
    </div>
  );
}
