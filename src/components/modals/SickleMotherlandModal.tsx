import { useGameStore } from '../../store/gameStore';
import styles from './SickleMotherlandModal.module.css';

interface SickleMotherlandModalProps {
  playerId: string;
  onClose: () => void;
}

export function SickleMotherlandModal({ playerId, onClose }: SickleMotherlandModalProps) {
  const players = useGameStore((state) => state.players);
  const updatePlayer = useGameStore((state) => state.updatePlayer);
  const addLogEntry = useGameStore((state) => state.addLogEntry);
  const rollDice = useGameStore((state) => state.rollDice);

  const player = players.find((p) => p.id === playerId);

  if (!player) {
    return null;
  }

  const handleAnnounce = () => {
    addLogEntry({
      type: 'system',
      message: `${player.name} announces: "FOR THE MOTHERLAND!" 🌾`,
      playerId: player.id,
    });
    updatePlayer(player.id, { sickleMotherlandForgotten: false });
    onClose();
    // Roll dice after announcement
    rollDice();
  };

  const handleForget = () => {
    if (player.rubles >= 25) {
      updatePlayer(player.id, {
        rubles: player.rubles - 25,
        sickleMotherlandForgotten: true
      });
      addLogEntry({
        type: 'payment',
        message: `${player.name} forgot to announce "For the Motherland!" and paid ₽25 fine`,
        playerId: player.id,
      });
    } else {
      addLogEntry({
        type: 'system',
        message: `${player.name} cannot afford the ₽25 fine for forgetting the announcement - Sickle ability penalty!`,
        playerId: player.id,
      });
      updatePlayer(player.id, { sickleMotherlandForgotten: true });
    }
    onClose();
    // Roll dice after paying fine (or not)
    rollDice();
  };

  return (
    <div className={styles.overlay} onClick={(e) => { e.stopPropagation(); }}>
      <div className={styles.modal} onClick={(e) => { e.stopPropagation(); }}>
        <div className={styles.header}>
          <span className={styles.icon}>🌾</span>
          <h2 className={styles.title}>Sickle Ability Requirement</h2>
          <span className={styles.icon}>🌾</span>
        </div>

        <div className={styles.content}>
          <p className={styles.description}>
            <strong>{player.name}</strong>, as the Sickle bearer, you must announce
            &quot;For the Motherland!&quot; before each roll of the dice.
          </p>

          <div className={styles.warningBox}>
            <span className={styles.warningIcon}>⚠</span>
            <p className={styles.warningText}>
              Failure to announce results in a ₽25 fine!
            </p>
          </div>

          <div className={styles.balanceInfo}>
            <span>Your Balance:</span>
            <span className={styles.balance}>₽{player.rubles}</span>
          </div>

          <div className={styles.buttonGroup}>
            <button className={styles.announceButton} onClick={handleAnnounce}>
              <div className={styles.buttonIcon}>🌾</div>
              <div className={styles.buttonText}>
                <div className={styles.buttonTitle}>I REMEMBERED TO ANNOUNCE</div>
                <div className={styles.buttonDesc}>&quot;For the Motherland!&quot;</div>
              </div>
            </button>

            <button className={`${styles.forgetButton} ${player.rubles < 25 ? styles.insufficient : ''}`} onClick={handleForget}>
              <div className={styles.buttonIcon}>❌</div>
              <div className={styles.buttonText}>
                <div className={styles.buttonTitle}>I FORGET</div>
                <div className={styles.buttonDesc}>Pay ₽25 fine</div>
              </div>
            </button>
          </div>

          {player.rubles < 25 && (
            <div className={styles.insufficientWarning}>
              You do not have ₽25 to pay the fine! Forgetting will still be recorded.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
