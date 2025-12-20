import { BoardSpace } from '../../types/game';
import { PROPERTY_COLORS } from '../../data/constants';
import { useGameStore } from '../../store/gameStore';
import { ownsCompleteGroup } from '../../utils/propertyUtils';
import styles from './PropertySpace.module.css';

interface PropertySpaceProps {
  space: BoardSpace;
}

// Player colors for ownership indicators
const PLAYER_COLORS = [
  '#C41E3A', // Red
  '#1C3A5F', // Blue
  '#228B22', // Green
  '#D4A84B', // Gold
  '#DB7093', // Pink
  '#87CEEB', // Light Blue
];

const PropertySpace = ({ space }: PropertySpaceProps) => {
  if (!space.group) return null;

  const colors = PROPERTY_COLORS[space.group];
  const property = useGameStore((state) =>
    state.properties.find((p) => p.spaceId === space.id)
  );
  const custodian = property?.custodianId
    ? useGameStore((state) => state.players.find((p) => p.id === property.custodianId))
    : null;
  const players = useGameStore((state) => state.players);
  const allProperties = useGameStore((state) => state.properties);

  const collectivizationLevel = property?.collectivizationLevel || 0;
  const isMortgaged = property?.mortgaged || false;

  // Check if custodian owns complete group
  const hasCompleteGroup = property?.custodianId && space.group
    ? ownsCompleteGroup(property.custodianId, space.group, allProperties)
    : false;

  // Get player color for ownership indicator
  const getPlayerColor = (custodian: typeof players[0]) => {
    const playerIndex = players.findIndex((p) => p.id === custodian.id);
    return PLAYER_COLORS[playerIndex % PLAYER_COLORS.length];
  };

  return (
    <div className={`${styles.propertySpace} ${isMortgaged ? styles.mortgaged : ''} ${hasCompleteGroup ? styles.completeGroup : ''}`}>
      {/* Color band */}
      <div
        className={styles.colorBand}
        style={{
          backgroundColor: colors.background,
          borderBottom: `2px solid ${colors.border}`,
        }}
      >
        {/* Ownership indicator */}
        {custodian && (
          <div
            className={styles.ownerIndicator}
            style={{ backgroundColor: getPlayerColor(custodian) }}
            title={`Owned by ${custodian.name}`}
          />
        )}
      </div>

      {/* Property content */}
      <div className={styles.content}>
        <div className={styles.name}>{space.name}</div>

        {space.baseQuota && (
          <div className={styles.quota}>
            <span className={styles.rubleSymbol}>₽</span>
            {space.baseQuota}
          </div>
        )}

        {/* Collectivization indicators */}
        {collectivizationLevel > 0 && (
          <div className={styles.collectivization}>
            {[...Array(4)].map((_, i) => (
              <span
                key={i}
                className={i < collectivizationLevel ? styles.filled : styles.empty}
              >
                ☆
              </span>
            ))}
            <span className={collectivizationLevel >= 5 ? styles.filled : styles.empty}>
              ★
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertySpace;
