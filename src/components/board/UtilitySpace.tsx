import { BoardSpace } from '../../types/game';
import { useGameStore } from '../../store/gameStore';
import styles from './UtilitySpace.module.css';

interface UtilitySpaceProps {
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

const UtilitySpace = ({ space }: UtilitySpaceProps) => {
  const isElectric = space.id === 12;
  const icon = isElectric ? '⚡' : '💧';

  const property = useGameStore((state) =>
    state.properties.find((p) => p.spaceId === space.id)
  );
  const custodian = property?.custodianId
    ? useGameStore((state) => state.players.find((p) => p.id === property.custodianId))
    : null;
  const players = useGameStore((state) => state.players);

  // Get player color for ownership indicator
  const getPlayerColor = (custodian: typeof players[0]) => {
    const playerIndex = players.findIndex((p) => p.id === custodian.id);
    return PLAYER_COLORS[playerIndex % PLAYER_COLORS.length];
  };

  return (
    <div className={styles.utility}>
      {custodian && (
        <div
          className={styles.ownerIndicator}
          style={{ backgroundColor: getPlayerColor(custodian) }}
          title={`Controlled by ${custodian.name}`}
        />
      )}
      <div className={styles.icon}>{icon}</div>
      <div className={styles.label}>MEANS OF<br/>PRODUCTION</div>
      <div className={styles.name}>{space.name}</div>
      <div className={styles.cost}>₽{space.baseCost}</div>
    </div>
  );
};

export default UtilitySpace;
