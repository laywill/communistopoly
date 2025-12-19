import { useEffect, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';
import { LogEntry } from '../../types/game';
import styles from './GameLog.module.css';

const GameLog = () => {
  const gameLog = useGameStore((state) => state.gameLog);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new entries are added
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameLog]);

  const getLogEntryClass = (type: LogEntry['type']) => {
    switch (type) {
      case 'movement':
        return styles.movement;
      case 'payment':
        return styles.payment;
      case 'gulag':
        return styles.gulag;
      case 'rank':
        return styles.rank;
      case 'property':
        return styles.property;
      case 'tribunal':
        return styles.tribunal;
      case 'dice':
        return styles.dice;
      case 'system':
      default:
        return styles.system;
    }
  };

  const formatTime = (timestamp: Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
        {gameLog.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📋</div>
            <div className={styles.emptyText}>
              No events recorded yet.
              <br />
              The revolution awaits!
            </div>
          </div>
        ) : (
          <>
            {gameLog.map((entry) => (
              <div key={entry.id} className={`${styles.entry} ${getLogEntryClass(entry.type)}`}>
                <div className={styles.entryTime}>{formatTime(entry.timestamp)}</div>
                <div className={styles.entryMessage}>{entry.message}</div>
              </div>
            ))}
            <div ref={logEndRef} />
          </>
        )}
      </div>
    </div>
  );
};

export default GameLog;
