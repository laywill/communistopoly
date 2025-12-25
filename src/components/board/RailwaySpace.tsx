// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { BoardSpace } from '../../types/game';
import { useGameStore } from '../../store/gameStore';
import styles from './RailwaySpace.module.css';

interface RailwaySpaceProps {
  space: BoardSpace;
}

// Player colors for ownership indicators (same as PropertySpace)
const PLAYER_COLORS = [
  '#C41E3A', // Red
  '#1C3A5F', // Blue
  '#228B22', // Green
  '#D4A84B', // Gold
  '#DB7093', // Pink
  '#87CEEB', // Light Blue
];

const RailwaySpace = ({ space }: RailwaySpaceProps) => {
  const property = useGameStore((state) =>
    state.properties.find((p) => p.spaceId === space.id)
  );
  const players = useGameStore((state) => state.players);
  const custodian = property?.custodianId
    ? players.find((p) => p.id === property.custodianId)
    : null;

  // Get player color for ownership indicator
  const getPlayerColor = (custodian: typeof players[0]) => {
    const playerIndex = players.findIndex((p) => p.id === custodian.id);
    return PLAYER_COLORS[playerIndex % PLAYER_COLORS.length];
  };

  return (
    <div className={styles.railway}>
      {custodian && (
        <div
          className={styles.ownerIndicator}
          style={{ backgroundColor: getPlayerColor(custodian) }}
          title={`Controlled by ${custodian.name}`}
        />
      )}
      <div className={styles.icon}>🚂</div>
      <div className={styles.name}>{space.name}</div>
      <div className={styles.label}>RAILWAY STATION</div>
      <div className={styles.cost}>₽{space.baseCost}</div>
    </div>
  );
};

export default RailwaySpace;
