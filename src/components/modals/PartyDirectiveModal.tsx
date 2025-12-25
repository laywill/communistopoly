import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { DirectiveCard } from '../../data/partyDirectiveCards'
import styles from './PartyDirectiveModal.module.css'

interface PartyDirectiveModalProps {
  card: DirectiveCard
  playerId: string
  onClose: () => void
}

export function PartyDirectiveModal ({ card, playerId, onClose }: PartyDirectiveModalProps) {
  const players = useGameStore((state) => state.players)
  const properties = useGameStore((state) => state.properties)
  const applyDirectiveEffect = useGameStore((state) => state.applyDirectiveEffect)

  const [isRevealed, setIsRevealed] = useState(false)
  const [isApplied, setIsApplied] = useState(false)

  const player = players.find((p) => p.id === playerId)

  if (!player) {
    return null
  }

  const handleReveal = () => {
    setIsRevealed(true)
  }

  const handleApply = () => {
    // Apply the directive effect
    applyDirectiveEffect(card, playerId)
    setIsApplied(true)
  }

  const handleClose = () => {
    if (isApplied) {
      onClose()
    }
  }

  // Get effect description for display
  const getEffectDescription = (): string => {
    switch (card.effect.type) {
      case 'move':
        return `Move to position ${String(card.effect.destination ?? 'unknown')}`
      case 'moveRelative':
        return card.effect.spaces && card.effect.spaces > 0
          ? `Move forward ${String(card.effect.spaces)} spaces`
          : `Move backward ${String(Math.abs(card.effect.spaces ?? 0))} spaces`
      case 'money':
        return card.effect.amount && card.effect.amount > 0
          ? `Collect ₽${String(card.effect.amount)}`
          : `Pay ₽${String(Math.abs(card.effect.amount ?? 0))}`
      case 'gulag':
        return 'Go directly to Gulag'
      case 'freeFromGulag':
        return 'Keep this card - use to escape Gulag'
      case 'rankChange':
        return card.effect.direction === 'up' ? 'Advance one rank' : 'Lose one rank'
      case 'collectFromAll':
        return `Collect ₽${String(card.effect.amount ?? 0)} from each player`
      case 'payToAll':
        return `Pay ₽${String(card.effect.amount ?? 0)} to each player`
      case 'propertyTax': {
        const playerProperties = properties.filter((p) => p.custodianId === playerId)
        const totalImprovements = playerProperties.reduce((sum, p) => sum + p.collectivizationLevel, 0)
        let total = 0
        if (card.effect.perProperty) {
          total += playerProperties.length * card.effect.perProperty
        }
        if (card.effect.perImprovement) {
          total += totalImprovements * card.effect.perImprovement
        }
        return `Pay ₽${String(total)} in taxes (${String(playerProperties.length)} properties, ${String(totalImprovements)} improvements)`
      }
      case 'custom':
        return card.description
      default:
        return card.description
    }
  }

  // Card back (before reveal)
  if (!isRevealed) {
    return (
      <div className={styles.overlay} onClick={(e) => { e.stopPropagation() }}>
        <div className={styles.modal} onClick={(e) => { e.stopPropagation() }}>
          <div className={styles.cardBack}>
            <div className={styles.cardBackContent}>
              <div className={styles.cardBackSymbol}>☭</div>
              <div className={styles.cardBackTitle}>PARTY DIRECTIVE</div>
              <div className={styles.cardBackSubtitle}>The Party Provides</div>
            </div>
          </div>

          <div className={styles.revealInstruction}>
            <p><strong>{player.name}</strong> has drawn a Party Directive card</p>
            <button className={styles.buttonReveal} onClick={handleReveal}>
              REVEAL DIRECTIVE
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Card revealed (show directive)
  return (
    <div className={styles.overlay} onClick={(e) => { e.stopPropagation() }}>
      <div className={styles.modal} onClick={(e) => { e.stopPropagation() }}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardSymbol}>☭</span>
            <h2 className={styles.cardCategory}>PARTY DIRECTIVE</h2>
            <span className={styles.cardSymbol}>☭</span>
          </div>

          <div className={styles.cardBody}>
            <h3 className={styles.cardTitle}>{card.title}</h3>

            <div className={styles.cardDescription}>
              <p>{card.description}</p>
            </div>

            <div className={styles.cardEffect}>
              <div className={styles.effectLabel}>Effect:</div>
              <div className={styles.effectText}>{getEffectDescription()}</div>
            </div>

            {card.flavorText && (
              <div className={styles.cardFlavor}>
                <em>{card.flavorText}</em>
              </div>
            )}

            {/* Special case: Free from Gulag card */}
            {card.effect.type === 'freeFromGulag' && (
              <div className={styles.keepCardNotice}>
                <p>⚠ This card will be saved to your inventory</p>
                <p>Use it to escape Gulag without penalty</p>
              </div>
            )}

            {/* Property tax breakdown */}
            {card.effect.type === 'propertyTax' && (
              <div className={styles.taxBreakdown}>
                <h4>Tax Breakdown:</h4>
                <ul>
                  {card.effect.perProperty !== undefined && card.effect.perProperty > 0 && (
                    <li>
                      {properties.filter((p) => p.custodianId === playerId).length} properties ×{' '}
                      ₽{card.effect.perProperty} = ₽
                      {properties.filter((p) => p.custodianId === playerId).length *
                        card.effect.perProperty}
                    </li>
                  )}
                  {card.effect.perImprovement !== undefined && card.effect.perImprovement > 0 && (
                    <li>
                      {properties
                        .filter((p) => p.custodianId === playerId)
                        .reduce((sum, p) => sum + p.collectivizationLevel, 0)}{' '}
                      improvements × ₽{card.effect.perImprovement} = ₽
                      {properties
                        .filter((p) => p.custodianId === playerId)
                        .reduce((sum, p) => sum + p.collectivizationLevel, 0) *
                        card.effect.perImprovement}
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>

          <div className={styles.cardFooter}>
            <div className={styles.cardStamp}>
              <span>MINISTRY OF STATE DIRECTIVES</span>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          {!isApplied ? (
            <button className={styles.buttonApply} onClick={handleApply}>
              APPLY DIRECTIVE
            </button>
          ) : (
            <button className={styles.buttonContinue} onClick={handleClose}>
              CONTINUE
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
