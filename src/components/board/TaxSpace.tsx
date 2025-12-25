// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { BoardSpace } from '../../types/game';
import styles from './TaxSpace.module.css';

interface TaxSpaceProps {
  space: BoardSpace;
}

const TaxSpace = ({ space }: TaxSpaceProps) => {
  const isRevolutionary = space.id === 4;

  return (
    <div className={styles.tax}>
      <div className={styles.icon}>📋</div>
      <div className={styles.stamp}>⚠️</div>
      <div className={styles.name}>{space.name}</div>
      {isRevolutionary ? (
        <div className={styles.details}>
          <div>15% of wealth</div>
          <div>OR ₽200</div>
          <div className={styles.warning}>Stalin may audit</div>
        </div>
      ) : (
        <div className={styles.details}>
          <div>Pay ₽100</div>
          <div className={styles.warning}>₽200 if wealthiest</div>
        </div>
      )}
    </div>
  );
};

export default TaxSpace;
