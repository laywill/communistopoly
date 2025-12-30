// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { BOARD_SPACES } from '../../data/spaces';
import { BoardSpace } from '../../types/game';
import { useGameStore } from '../../store/gameStore';
import CornerSpace from './CornerSpace';
import BoardSpaceComponent from './BoardSpace';
import BoardCenter from './BoardCenter';
import PlayerPiece from './PlayerPiece';
import styles from './Board.module.css';

const Board = () => {
  const players = useGameStore((state) => state.players);
  const currentPlayerIndex = useGameStore((state) => state.currentTurnIndex);

  // Split spaces into their respective positions
  const bottomRow = BOARD_SPACES.slice(0, 11);      // 0-10: STOY to GULAG
  const leftColumn = BOARD_SPACES.slice(11, 20);    // 11-19: After GULAG to before BREADLINE
  const topRow = BOARD_SPACES.slice(20, 31);        // 20-30: BREADLINE to ENEMY OF STATE
  const rightColumn = BOARD_SPACES.slice(31, 40);   // 31-39: After ENEMY to before STOY

  // Get players at a specific position
  const getPlayersAtPosition = (position: number) => {
    return players.filter(player => !player.isStalin && player.position === position);
  };

  const renderSpace = (space: BoardSpace, edgePosition: 'top' | 'bottom' | 'left' | 'right', additionalClass?: string) => {
    const className = additionalClass ?? '';
    const playersHere = getPlayersAtPosition(space.id);

    if (space.type === 'corner') {
      return (
        <div key={space.id} className={styles.spaceWrapper}>
          <CornerSpace space={space} />
          {playersHere.length > 0 && (
            <div className={`${styles.playersOnSpace} ${styles[`players${edgePosition.charAt(0).toUpperCase()}${edgePosition.slice(1)}`]}`}>
              {playersHere.map(player => (
                <PlayerPiece
                  key={player.id}
                  player={player}
                  isCurrentPlayer={players[currentPlayerIndex]?.id === player.id}
                />
              ))}
            </div>
          )}
        </div>
      );
    }
    return (
      <div key={space.id} className={`${styles.spaceWrapper} ${className}`}>
        <BoardSpaceComponent space={space} />
        {playersHere.length > 0 && (
          <div className={`${styles.playersOnSpace} ${styles[`players${edgePosition.charAt(0).toUpperCase()}${edgePosition.slice(1)}`]}`}>
            {playersHere.map(player => (
              <PlayerPiece
                key={player.id}
                player={player}
                isCurrentPlayer={players[currentPlayerIndex]?.id === player.id}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.board}>
      <div className={styles.boardRing}>
        {/* Top Row: BREADLINE (20) to ENEMY OF STATE (30) */}
        <div className={styles.topRow}>
          {topRow.map(space => renderSpace(space, 'top'))}
        </div>

        {/* Middle Section: Left Column + Center + Right Column */}
        <div className={styles.middleSection}>
          {/* Left Column: Spaces 11-19 (bottom to top, reversed, rotated 90deg) */}
          <div className={styles.leftColumn}>
            {[...leftColumn].reverse().map(space => renderSpace(space, 'left', styles.rotateLeft))}
          </div>

          {/* Center Area */}
          <div className={styles.centerArea}>
            <BoardCenter />
          </div>

          {/* Right Column: Spaces 31-39 (top to bottom, rotated -90deg) */}
          <div className={styles.rightColumn}>
            {rightColumn.map(space => renderSpace(space, 'right', styles.rotateRight))}
          </div>
        </div>

        {/* Bottom Row: GULAG (10) to STOY (0) - left to right order */}
        <div className={styles.bottomRow}>
          {[...bottomRow].reverse().map(space => renderSpace(space, 'bottom'))}
        </div>
      </div>
    </div>
  );
};

export default Board;
