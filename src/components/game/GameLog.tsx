// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { useGameStore } from '../../store/gameStore'
import { LogEntry } from '../../types/game'
import styles from './GameLog.module.css'

const GameLog = (): React.JSX.Element => {
  const gameLog = useGameStore((state) => state.gameLog)

  const getLogEntryClass = (type: LogEntry['type']): string => {
    switch (type) {
      case 'movement':
        return styles.movement
      case 'payment':
        return styles.payment
      case 'gulag':
        return styles.gulag
      case 'rank':
        return styles.rank
      case 'property':
        return styles.property
      case 'tribunal':
        return styles.tribunal
      case 'dice':
        return styles.dice
      case 'system':
      default:
        return styles.system
    }
  }

  const formatTime = (timestamp: Date): string => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerIcon}>☭</div>
        <div className={styles.headerText}>
          <div className={styles.title}>OFFICIAL PARTY RECORD</div>
          <div className={styles.subtitle}>ЗАПИСЬ ПАРТИИ</div>
        </div>
        <div className={styles.headerIcon}>☭</div>
      </div>

      <div className={styles.logContainer}>
        {gameLog.length === 0
          ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>📋</div>
              <div className={styles.emptyText}>
                No events recorded yet.
                <br />
                The revolution awaits!
              </div>
            </div>
            )
          : (
            <>
              {[...gameLog].reverse().map((entry) => (
                <div key={entry.id} className={`${styles.entry} ${getLogEntryClass(entry.type)}`}>
                  <div className={styles.entryTime}>{formatTime(entry.timestamp)}</div>
                  <div className={styles.entryMessage}>{entry.message}</div>
                </div>
              ))}
            </>
            )}
      </div>
    </div>
  )
}

export default GameLog
