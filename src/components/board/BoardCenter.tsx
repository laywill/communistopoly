// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { useEffect } from 'react'
import { useGameStore } from '../../store/gameStore'
import Dice from '../game/Dice'
import styles from './BoardCenter.module.css'

const BoardCenter = (): JSX.Element => {
  const players = useGameStore((state) => state.players)
  const currentPlayerIndex = useGameStore((state) => state.currentPlayerIndex)
  const turnPhase = useGameStore((state) => state.turnPhase)
  const dice = useGameStore((state) => state.dice)
  const isRolling = useGameStore((state) => state.isRolling)
  const hasRolled = useGameStore((state) => state.hasRolled)
  const rollDice = useGameStore((state) => state.rollDice)
  const finishRolling = useGameStore((state) => state.finishRolling)
  const handleGulagTurn = useGameStore((state) => state.handleGulagTurn)
  const partyDirectiveDeck = useGameStore((state) => state.partyDirectiveDeck)
  const communistTestUsedQuestions = useGameStore((state) => state.communistTestUsedQuestions)
  const setPendingAction = useGameStore((state) => state.setPendingAction)

  const currentPlayer = players[currentPlayerIndex]
  const [die1, die2] = dice
  const isDoubles = die1 === die2

  // Handle Gulag players' turns
  useEffect(() => {
    if (turnPhase === 'pre-roll' && !hasRolled && currentPlayer.inGulag) {
      handleGulagTurn(currentPlayer.id)
    }
    // Only depend on turnPhase and currentPlayerIndex to prevent infinite loop
    // when gulagTurns increments (which changes currentPlayer object)
  }, [turnPhase, currentPlayerIndex, hasRolled, currentPlayer.inGulag, handleGulagTurn, currentPlayer.id])

  // Handle starving Bread Loaf players
  useEffect(() => {
    if (
      turnPhase === 'pre-roll' &&
      !hasRolled &&
      !currentPlayer.inGulag &&
      currentPlayer.piece === 'breadLoaf' &&
      currentPlayer.rubles < 100
    ) {
      setPendingAction({
        type: 'bread-loaf-begging',
        data: { playerId: currentPlayer.id }
      })
    }
  }, [turnPhase, currentPlayerIndex, hasRolled, currentPlayer.inGulag, currentPlayer.piece, currentPlayer.rubles, setPendingAction, currentPlayer.id])

  const handleRoll = (): void => {
    if (turnPhase === 'pre-roll' && !hasRolled && !currentPlayer.inGulag) {
      // Check if player is Sickle - they must announce "For the Motherland!"
      if (currentPlayer.piece === 'sickle') {
        setPendingAction({
          type: 'sickle-motherland-announcement',
          data: { playerId: currentPlayer.id }
        })
      } else {
        rollDice()
      }
    }
  }

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
              <div className={styles.cardLabel}>Party<br />Directive</div>
              <div className={styles.cardCount}>{partyDirectiveDeck.length} cards</div>
            </div>
            <div className={styles.cardDeck}>
              <div className={styles.cardIcon}>★</div>
              <div className={styles.cardLabel}>Communist<br />Test</div>
              <div className={styles.cardCount}>{communistTestUsedQuestions.size} used</div>
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
            {turnPhase === 'pre-roll' && !hasRolled && !currentPlayer.inGulag && (
              <button className={styles.rollButton} onClick={handleRoll}>
                ROLL DICE
              </button>
            )}
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>CURRENT TURN</div>
          <div className={styles.turnInfo}>
            <div className={styles.playerName}>{currentPlayer.name}</div>
            <div className={styles.playerPiece}>{getPieceEmoji(currentPlayer.piece)}</div>
            <div className={styles.turnPhase}>{getTurnPhaseText(turnPhase)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function getPieceEmoji (piece: string | null): string {
  const pieceEmojis: Record<string, string> = {
    hammer: '🔨',
    sickle: '🌾',
    redStar: '⭐',
    tank: '🚛',
    breadLoaf: '🍞',
    ironCurtain: '🚧',
    vodkaBottle: '🍾',
    statueOfLenin: '🗿'
  }
  return pieceEmojis[piece ?? ''] ?? '●'
}

function getTurnPhaseText (phase: string): string {
  const phaseTexts: Record<string, string> = {
    'pre-roll': 'Ready to Roll',
    rolling: 'Rolling Dice...',
    moving: 'Moving...',
    resolving: 'Resolving Space',
    'post-turn': 'Turn Complete'
  }
  return phaseTexts[phase] ?? phase
}

export default BoardCenter
