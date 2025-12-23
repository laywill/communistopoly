import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import styles from './StoyPilferModal.module.css';

interface StoyPilferModalProps {
  playerId: string;
  onClose: () => void;
}

const StoyPilferModal = ({ playerId, onClose }: StoyPilferModalProps) => {
  const [hasRolled, setHasRolled] = useState(false);
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const handleStoyPilfer = useGameStore((state) => state.handleStoyPilfer);
  const player = useGameStore((state) => state.players.find((p) => p.id === playerId));

  const handleRoll = () => {
    setIsRolling(true);
    setHasRolled(true);

    // Animate the roll for 1 second
    const interval = setInterval(() => {
      setDiceResult(Math.floor(Math.random() * 6) + 1);
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      const finalRoll = Math.floor(Math.random() * 6) + 1;
      setDiceResult(finalRoll);
      setIsRolling(false);

      // Wait a moment before processing result
      setTimeout(() => {
        handleStoyPilfer(playerId, finalRoll);
        onClose();
      }, 2000);
    }, 1000);
  };

  const getDieFace = (value: number) => {
    const faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    return faces[value - 1] || '⚀';
  };

  const getOutcome = () => {
    if (diceResult === null) return null;
    return diceResult >= 4 ? 'success' : 'failure';
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.icon}>🚧</div>
          <h2>STOY CHECKPOINT</h2>
          <div className={styles.russian}>СТОЙ</div>
        </div>

        <div className={styles.content}>
          <div className={styles.scenario}>
            <p className={styles.message}>
              Comrade {player?.name}, you have landed exactly on the STOY checkpoint!
            </p>
            <p className={styles.description}>
              You may attempt to pilfer from the State Treasury while the guards aren&apos;t watching.
            </p>
          </div>

          <div className={styles.rules}>
            <div className={styles.ruleItem}>
              <span className={styles.ruleLabel}>Roll 4-6:</span>
              <span className={styles.ruleSuccess}>Steal ₽100 from State Treasury!</span>
            </div>
            <div className={styles.ruleItem}>
              <span className={styles.ruleLabel}>Roll 1-3:</span>
              <span className={styles.ruleFail}>Caught! Sent directly to Gulag</span>
            </div>
          </div>

          {!hasRolled ? (
            <button className={styles.rollButton} onClick={handleRoll}>
              ATTEMPT PILFERING
            </button>
          ) : (
            <div className={styles.result}>
              <div className={`${styles.die} ${isRolling ? styles.rolling : ''}`}>
                {diceResult !== null && (
                  <div className={styles.dieFace}>{getDieFace(diceResult)}</div>
                )}
              </div>

              {!isRolling && diceResult !== null && (
                <div className={`${styles.outcome} ${styles[getOutcome() || '']}`}>
                  {getOutcome() === 'success' ? (
                    <>
                      <div className={styles.outcomeIcon}>✓</div>
                      <div className={styles.outcomeText}>
                        Success! You pilfered ₽100!
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={styles.outcomeIcon}>✗</div>
                      <div className={styles.outcomeText}>
                        Caught! Off to the Gulag!
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoyPilferModal;
