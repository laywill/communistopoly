import { BoardSpace } from '../../types/game';
import { PROPERTY_COLORS } from '../../data/constants';
import styles from './PropertySpace.module.css';

interface PropertySpaceProps {
  space: BoardSpace;
}

const PropertySpace = ({ space }: PropertySpaceProps) => {
  if (!space.group) return null;

  const colors = PROPERTY_COLORS[space.group];
  const collectivizationLevel = 0; // Placeholder - no game logic yet

  return (
    <div className={styles.propertySpace}>
      {/* Color band */}
      <div
        className={styles.colorBand}
        style={{
          backgroundColor: colors.background,
          borderBottom: `2px solid ${colors.border}`,
        }}
      />

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
      </div>
    </div>
  );
};

export default PropertySpace;
