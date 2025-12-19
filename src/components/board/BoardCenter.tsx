import styles from './BoardCenter.module.css';

const BoardCenter = () => {
  return (
    <div className={styles.center}>
      <div className={styles.header}>
        <div className={styles.russian}>СОВЕТСКИЙ ЦЕНТР</div>
        <div className={styles.english}>SOVIET CENTER</div>
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <div className={styles.sectionTitle}>CARD DECKS</div>
          <div className={styles.cards}>
            <div className={styles.cardDeck}>
              <div className={styles.cardIcon}>☭</div>
              <div className={styles.cardLabel}>Party<br/>Directive</div>
            </div>
            <div className={styles.cardDeck}>
              <div className={styles.cardIcon}>★</div>
              <div className={styles.cardLabel}>Communist<br/>Test</div>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>DICE AREA</div>
          <div className={styles.dice}>
            <div className={styles.diceBox}>⚄</div>
            <div className={styles.diceBox}>⚂</div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>CURRENT TURN</div>
          <div className={styles.turnInfo}>
            <div className={styles.turnPlaceholder}>
              Game Not Started
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoardCenter;
