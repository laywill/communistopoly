import { BOARD_SPACES } from '../../data/spaces';
import { BoardSpace } from '../../types/game';
import CornerSpace from './CornerSpace';
import BoardSpaceComponent from './BoardSpace';
import BoardCenter from './BoardCenter';
import styles from './Board.module.css';

const Board = () => {
  // Split spaces into their respective positions
  const bottomRow = BOARD_SPACES.slice(0, 11);      // 0-10: STOY to GULAG
  const leftColumn = BOARD_SPACES.slice(11, 20);    // 11-19: After GULAG to before BREADLINE
  const topRow = BOARD_SPACES.slice(20, 31);        // 20-30: BREADLINE to ENEMY OF STATE
  const rightColumn = BOARD_SPACES.slice(31, 40);   // 31-39: After ENEMY to before STOY

  const renderSpace = (space: BoardSpace) => {
    if (space.type === 'corner') {
      return <CornerSpace key={space.id} space={space} />;
    }
    return <BoardSpaceComponent key={space.id} space={space} />;
  };

  return (
    <div className={styles.board}>
      <div className={styles.boardRing}>
        {/* Top Row: BREADLINE (20) to ENEMY OF STATE (30) */}
        <div className={styles.topRow}>
          {topRow.map(renderSpace)}
        </div>

        {/* Middle Section: Left Column + Center + Right Column */}
        <div className={styles.middleSection}>
          {/* Left Column: Spaces 11-19 (bottom to top, reversed) */}
          <div className={styles.leftColumn}>
            {[...leftColumn].reverse().map(renderSpace)}
          </div>

          {/* Center Area */}
          <div className={styles.centerArea}>
            <BoardCenter />
          </div>

          {/* Right Column: Spaces 31-39 (top to bottom) */}
          <div className={styles.rightColumn}>
            {rightColumn.map(renderSpace)}
          </div>
        </div>

        {/* Bottom Row: GULAG (10) to STOY (0) - reversed */}
        <div className={styles.bottomRow}>
          {[...bottomRow].reverse().map(renderSpace)}
        </div>
      </div>
    </div>
  );
};

export default Board;
