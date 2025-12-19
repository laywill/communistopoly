import { useGameStore } from '../../store/gameStore';
import Dice from '../game/Dice';
import styles from './BoardCenter.module.css';

const BoardCenter = () => {
  const players = useGameStore((state) => state.players);
  const currentPlayerIndex = useGameStore((state) => state.currentPlayerIndex);
  const turnPhase = useGameStore((state) => state.turnPhase);
  const dice = useGameStore((state) => state.dice);
  const isRolling = useGameStore((state) => state.isRolling);
  const hasRolled = useGameStore((state) => state.hasRolled);
  const rollDice = useGameStore((state) => state.rollDice);
  const finishRolling = useGameStore((state) => state.finishRolling);

  const currentPlayer = players[currentPlayerIndex];
  const [die1, die2] = dice;
  const isDoubles = die1 === die2;

  const handleRoll = () => {
    if (turnPhase === 'pre-roll' && !hasRolled && currentPlayer && !currentPlayer.inGulag) {
      rollDice();
    }
  };

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
          <div className={styles.sectionTitle}>DICE</div>
          <div className={styles.diceArea}>
            <Dice
              die1={die1}
              die2={die2}
              isRolling={isRolling}
              isDoubles={isDoubles}
              onRollComplete={finishRolling}
            />
            {turnPhase === 'pre-roll' && !hasRolled && currentPlayer && !currentPlayer.inGulag && (
              <button className={styles.rollButton} onClick={handleRoll}>
                ROLL DICE
              </button>
            )}
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>CURRENT TURN</div>
          <div className={styles.turnInfo}>
            {currentPlayer ? (
              <>
                <div className={styles.playerName}>{currentPlayer.name}</div>
                <div className={styles.playerPiece}>{getPieceEmoji(currentPlayer.piece)}</div>
                <div className={styles.turnPhase}>{getTurnPhaseText(turnPhase)}</div>
              </>
            ) : (
              <div className={styles.turnPlaceholder}>
                Game Not Started
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function getPieceEmoji(piece: string | null): string {
  const pieceEmojis: Record<string, string> = {
    hammer: '🔨',
    sickle: '🌾',
    redStar: '⭐',
    tank: '🚜',
    breadLoaf: '🍞',
    ironCurtain: '🎭',
    vodkaBottle: '🍾',
    statueOfLenin: '🗿',
  };
  return pieceEmojis[piece || ''] || '●';
}

function getTurnPhaseText(phase: string): string {
  const phaseTexts: Record<string, string> = {
    'pre-roll': 'Ready to Roll',
    'rolling': 'Rolling Dice...',
    'moving': 'Moving...',
    'resolving': 'Resolving Space',
    'post-turn': 'Turn Complete',
  };
  return phaseTexts[phase] || phase;
}

export default BoardCenter;
