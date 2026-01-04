// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { BoardSpace } from '../../types/game'
import styles from './CornerSpace.module.css'

interface CornerSpaceProps {
  space: BoardSpace
}

const getCornerType = (spaceId: number): string => {
  switch (spaceId) {
    case 0: return 'stoy'
    case 10: return 'gulag'
    case 20: return 'breadline'
    case 30: return 'enemy'
    default: return 'unknown'
  }
}

const CornerSpace = ({ space }: CornerSpaceProps) => {
  const cornerType = getCornerType(space.id)

  return (
    <div className={`${styles.corner} ${styles[cornerType]}`}>
      <div className={styles.content}>
        {cornerType === 'stoy' && (
          <>
            <div className={styles.icon}>🛑</div>
            <div className={styles.russian}>{space.russianName}</div>
            <div className={styles.name}>{space.name}</div>
            <div className={styles.subtext}>
              <div>Pay ₽200</div>
              <div className={styles.small}>Pilfer?</div>
            </div>
          </>
        )}

        {cornerType === 'gulag' && (
          <>
            <div className={styles.icon}>⛓️</div>
            <div className={styles.russian}>{space.russianName}</div>
            <div className={styles.name}>{space.name}</div>
            <div className={styles.bars}>||||</div>
          </>
        )}

        {cornerType === 'breadline' && (
          <>
            <div className={styles.icon}>🍞</div>
            <div className={styles.russian}>{space.russianName}</div>
            <div className={styles.name}>{space.name}</div>
            <div className={styles.subtext}>Collect from all</div>
          </>
        )}

        {cornerType === 'enemy' && (
          <>
            <div className={styles.icon}>☠️</div>
            <div className={styles.russian}>{space.russianName}</div>
            <div className={styles.name}>{space.name}</div>
            <div className={styles.danger}>TO GULAG</div>
          </>
        )}
      </div>
    </div>
  )
}

export default CornerSpace
