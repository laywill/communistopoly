// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { getSpaceById } from '../../data/spaces'
import styles from './TaxModal.module.css'

interface TaxModalProps {
  spaceId: number
  playerId: string
  onClose: () => void
}

export function TaxModal ({ spaceId, playerId, onClose }: TaxModalProps): JSX.Element | null {
  const players = useGameStore((state) => state.players)
  const properties = useGameStore((state) => state.properties)
  const updatePlayer = useGameStore((state) => state.updatePlayer)
  const demotePlayer = useGameStore((state) => state.demotePlayer)
  const adjustTreasury = useGameStore((state) => state.adjustTreasury)
  const addLogEntry = useGameStore((state) => state.addLogEntry)
  const setPendingAction = useGameStore((state) => state.setPendingAction)
  const setTurnPhase = useGameStore((state) => state.setTurnPhase)

  const [showStalinAudit, setShowStalinAudit] = useState(false)
  const [playerChoice, setPlayerChoice] = useState<'percentage' | 'flat' | null>(null)

  const space = getSpaceById(spaceId)
  const player = players.find((p) => p.id === playerId)

  if ((space == null) || (player == null)) {
    return null
  }

  const isRevolutionaryContribution = spaceId === 4
  const isBourgeoisDecadence = spaceId === 38

  // Calculate total wealth for Revolutionary Contribution
  const calculateTotalWealth = (): number => {
    let wealth = player.rubles

    // Add property values
    player.properties.forEach((propId) => {
      const prop = properties.find((p) => p.spaceId === parseInt(propId))
      if (prop != null) {
        const propSpace = getSpaceById(prop.spaceId)
        if (propSpace?.baseCost != null) {
          wealth += propSpace.baseCost
        }
      }
    })

    // Add improvement values (collectivization levels)
    player.properties.forEach((propId) => {
      const prop = properties.find((p) => p.spaceId === parseInt(propId))
      if ((prop != null) && prop.collectivizationLevel > 0) {
        // Each level 1-4 costs 100₽, level 5 costs 200₽
        const improvementCost = prop.collectivizationLevel <= 4
          ? prop.collectivizationLevel * 100
          : 400 + 200 // 4 * 100 + 200 for level 5
        wealth += improvementCost
      }
    })

    return wealth
  }

  // Check if player is wealthiest for Bourgeois Decadence
  const isWealthiest = (): boolean => {
    const playerWealth = calculateTotalWealth()
    const otherPlayers = players.filter((p) => !p.isStalin && p.id !== playerId)

    return otherPlayers.every((p) => {
      let otherWealth = p.rubles
      p.properties.forEach((propId) => {
        const prop = properties.find((pr) => pr.spaceId === parseInt(propId))
        if (prop != null) {
          const propSpace = getSpaceById(prop.spaceId)
          if (propSpace?.baseCost != null) {
            otherWealth += propSpace.baseCost
          }
          if (prop.collectivizationLevel > 0) {
            const improvementCost = prop.collectivizationLevel <= 4
              ? prop.collectivizationLevel * 100
              : 400 + 200
            otherWealth += improvementCost
          }
        }
      })
      return playerWealth >= otherWealth
    })
  }

  const totalWealth = calculateTotalWealth()
  const percentageAmount = Math.floor(totalWealth * 0.15)
  const flatAmount = 200
  const isWealthiestPlayer = isWealthiest()

  const handleRevolutionaryChoice = (choice: 'percentage' | 'flat'): void => {
    setPlayerChoice(choice)
    setShowStalinAudit(true)
  }

  const handleStalinAudit = (shouldAudit: boolean): void => {
    if (playerChoice == null) return

    const chosenAmount = playerChoice === 'percentage' ? percentageAmount : flatAmount
    const actualAmount = Math.min(percentageAmount, flatAmount)

    if (shouldAudit && chosenAmount > actualAmount) {
      // Player chose the higher amount when lower was available - audit penalty
      const penalty = 50
      const difference = chosenAmount - actualAmount
      const totalPayment = actualAmount + difference + penalty

      // Check if player can afford it
      if (player.rubles < totalPayment) {
        setPendingAction({
          type: 'liquidation-required',
          data: {
            playerId,
            amountOwed: totalPayment,
            creditorId: 'state',
            reason: 'Revolutionary Contribution with audit penalty'
          }
        })
        return
      }

      updatePlayer(playerId, { rubles: player.rubles - totalPayment })
      adjustTreasury(totalPayment)

      addLogEntry({
        type: 'payment',
        message: `${player.name} paid ₽${String(totalPayment)} Revolutionary Contribution (₽${String(actualAmount)} + ₽${String(difference)} difference + ₽${String(penalty)} audit penalty)`,
        playerId
      })
    } else {
      // No audit or player chose correctly
      // Check if player can afford it
      if (player.rubles < chosenAmount) {
        setPendingAction({
          type: 'liquidation-required',
          data: {
            playerId,
            amountOwed: chosenAmount,
            creditorId: 'state',
            reason: 'Revolutionary Contribution'
          }
        })
        return
      }

      updatePlayer(playerId, { rubles: player.rubles - chosenAmount })
      adjustTreasury(chosenAmount)

      addLogEntry({
        type: 'payment',
        message: `${player.name} paid ₽${String(chosenAmount)} Revolutionary Contribution${shouldAudit ? ' (audited - no penalty)' : ''}`,
        playerId
      })
    }

    setPendingAction(null)
    setTurnPhase('post-turn')
    onClose()
  }

  const handleBourgeoisDecadence = (): void => {
    const amount = isWealthiestPlayer ? 200 : 100

    // Check if player can afford it
    if (player.rubles < amount) {
      setPendingAction({
        type: 'liquidation-required',
        data: {
          playerId,
          amountOwed: amount,
          creditorId: 'state',
          reason: 'Bourgeois Decadence Tax'
        }
      })
      return
    }

    updatePlayer(playerId, { rubles: player.rubles - amount })
    adjustTreasury(amount)

    if (isWealthiestPlayer) {
      demotePlayer(playerId)
      addLogEntry({
        type: 'payment',
        message: `${player.name} paid ₽${String(amount)} Bourgeois Decadence Tax as the wealthiest comrade - demoted for capitalist tendencies!`,
        playerId
      })
    } else {
      addLogEntry({
        type: 'payment',
        message: `${player.name} paid ₽${String(amount)} Bourgeois Decadence Tax`,
        playerId
      })
    }

    setPendingAction(null)
    setTurnPhase('post-turn')
    onClose()
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => { e.stopPropagation() }}>
        <div className={styles.header}>
          <span className={styles.icon}>📋</span>
          <h2 className={styles.title}>{space.name}</h2>
          <span className={styles.icon}>📋</span>
        </div>

        <div className={styles.content}>
          {isRevolutionaryContribution && (
            <>
              <div className={styles.taxInfo}>
                <p className={styles.description}>
                  All comrades must contribute to the Revolution!
                  Choose your contribution method:
                </p>
              </div>

              <div className={styles.wealthCalculation}>
                <h4 className={styles.calcTitle}>Your Total Wealth:</h4>
                <div className={styles.wealthBreakdown}>
                  <div className={styles.wealthItem}>
                    <span>Rubles on hand:</span>
                    <span>₽{player.rubles}</span>
                  </div>
                  <div className={styles.wealthItem}>
                    <span>Property values:</span>
                    <span>₽{totalWealth - player.rubles}</span>
                  </div>
                  <div className={styles.wealthDivider} />
                  <div className={styles.wealthTotal}>
                    <span>Total Wealth:</span>
                    <span>₽{totalWealth}</span>
                  </div>
                </div>
              </div>

              {!showStalinAudit && (
                <div className={styles.choices}>
                  <button
                    className={styles.choiceButton}
                    onClick={() => { handleRevolutionaryChoice('percentage') }}
                  >
                    <div className={styles.choiceTitle}>15% of Total Wealth</div>
                    <div className={styles.choiceAmount}>₽{percentageAmount}</div>
                  </button>

                  <div className={styles.orDivider}>OR</div>

                  <button
                    className={styles.choiceButton}
                    onClick={() => { handleRevolutionaryChoice('flat') }}
                  >
                    <div className={styles.choiceTitle}>Flat Rate</div>
                    <div className={styles.choiceAmount}>₽{flatAmount}</div>
                  </button>
                </div>
              )}

              {showStalinAudit && (
                <div className={styles.auditSection}>
                  <div className={styles.choiceConfirm}>
                    <strong>Choice Made:</strong> {playerChoice === 'percentage' ? `15% (₽${String(percentageAmount)})` : `Flat Rate (₽${String(flatAmount)})`}
                  </div>

                  <div className={styles.stalinDecision}>
                    <h4 className={styles.auditTitle}>⚖ STALIN&apos;S AUDIT DECISION ⚖</h4>
                    <p className={styles.auditDescription}>
                      Stalin may audit this contribution. If the player chose the higher amount,
                      they must pay the difference plus a ₽50 penalty!
                    </p>

                    <div className={styles.auditButtons}>
                      <button
                        className={styles.noAuditButton}
                        onClick={() => { handleStalinAudit(false) }}
                      >
                        NO AUDIT - Accept Payment
                      </button>
                      <button
                        className={styles.auditButton}
                        onClick={() => { handleStalinAudit(true) }}
                      >
                        AUDIT - Verify Contribution
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {isBourgeoisDecadence && (
            <>
              <div className={styles.taxInfo}>
                <p className={styles.description}>
                  The State frowns upon excessive wealth accumulation!
                </p>
              </div>

              {isWealthiestPlayer && (
                <div className={styles.wealthiestWarning}>
                  <strong>⚠ YOU ARE THE WEALTHIEST COMRADE!</strong>
                  <p>
                    Such capitalist tendencies cannot be tolerated!
                    You must pay ₽200 AND lose one rank as punishment.
                  </p>
                </div>
              )}

              <div className={styles.taxDue}>
                <span className={styles.taxLabel}>Tax Due:</span>
                <span className={styles.taxValue}>₽{isWealthiestPlayer ? 200 : 100}</span>
              </div>

              <div className={styles.playerBalance}>
                <span className={styles.balanceLabel}>Your Balance:</span>
                <span className={styles.balanceValue}>₽{player.rubles}</span>
              </div>

              <button
                className={styles.payButton}
                onClick={handleBourgeoisDecadence}
              >
                PAY TAX{isWealthiestPlayer ? ' & ACCEPT DEMOTION' : ''}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
