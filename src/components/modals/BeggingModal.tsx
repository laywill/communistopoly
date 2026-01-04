// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import styles from './BeggingModal.module.css'

interface BeggingModalProps {
  playerId: string
  onClose: () => void
}

export function BeggingModal ({ playerId, onClose }: BeggingModalProps): JSX.Element | null {
  const players = useGameStore((state) => state.players)
  const updatePlayer = useGameStore((state) => state.updatePlayer)
  const addLogEntry = useGameStore((state) => state.addLogEntry)

  const [selectedTargetId, setSelectedTargetId] = useState<string>('')
  const [requestedAmount, setRequestedAmount] = useState<number>(50)
  const [showResult, setShowResult] = useState(false)
  const [wasGranted, setWasGranted] = useState(false)

  const player = players.find((p) => p.id === playerId)
  const eligibleTargets = players.filter((p) => !p.isEliminated && !p.inGulag && p.id !== playerId)

  if (player == null) {
    return null
  }

  const handleBeg = (granted: boolean): void => {
    const target = players.find((p) => p.id === selectedTargetId)
    if (target == null) return

    if (granted) {
      // Check if target can afford
      if (target.rubles < requestedAmount) {
        alert(`${target.name} does not have ₽${String(requestedAmount)} to give!`)
        return
      }

      // Transfer rubles
      updatePlayer(target.id, { rubles: target.rubles - requestedAmount })
      updatePlayer(player.id, { rubles: player.rubles + requestedAmount })

      addLogEntry({
        type: 'payment',
        message: `${target.name} gave ₽${String(requestedAmount)} to starving ${player.name} 🍞`,
        playerId: target.id
      })

      setWasGranted(true)
    } else {
      addLogEntry({
        type: 'system',
        message: `${target.name} refused to help starving ${player.name}`,
        playerId: target.id
      })

      setWasGranted(false)
    }

    setShowResult(true)
  }

  const handleFinish = (): void => {
    onClose()
  }

  if (showResult) {
    return (
      <div className={styles.overlay} onClick={(e) => { e.stopPropagation() }}>
        <div className={styles.modal} onClick={(e) => { e.stopPropagation() }}>
          <div className={styles.header}>
            <span className={styles.icon}>🍞</span>
            <h2 className={styles.title}>Begging Result</h2>
            <span className={styles.icon}>🍞</span>
          </div>

          <div className={styles.content}>
            {wasGranted
              ? (
                <div className={styles.successMessage}>
                  <span className={styles.successIcon}>✅</span>
                  <p>You received ₽{requestedAmount} from your comrade!</p>
                  <p className={styles.currentBalance}>Current Balance: ₽{player.rubles}</p>
                </div>
                )
              : (
                <div className={styles.failureMessage}>
                  <span className={styles.failureIcon}>❌</span>
                  <p>Your plea for help was refused...</p>
                  <p className={styles.starvingWarning}>You remain starving (balance: ₽{player.rubles})</p>
                </div>
                )}

            <button className={styles.continueButton} onClick={handleFinish}>
              CONTINUE
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (selectedTargetId === '') {
    return (
      <div className={styles.overlay} onClick={(e) => { e.stopPropagation() }}>
        <div className={styles.modal} onClick={(e) => { e.stopPropagation() }}>
          <div className={styles.header}>
            <span className={styles.icon}>🍞</span>
            <h2 className={styles.title}>Starving - Must Beg</h2>
            <span className={styles.icon}>🍞</span>
          </div>

          <div className={styles.content}>
            <div className={styles.starvingNotice}>
              <p className={styles.description}>
                <strong>{player.name}</strong>, you have less than ₽100 and are starving!
              </p>
              <p className={styles.starvingBalance}>
                Current Balance: <span className={styles.dangerAmount}>₽{player.rubles}</span>
              </p>
            </div>

            <div className={styles.beggingInfo}>
              <p className={styles.infoText}>
                As part of the Bread Loaf ability penalty, you must beg for charity each turn when starving.
                Choose a comrade to ask for help:
              </p>
            </div>

            <div className={styles.targetSelection}>
              <label className={styles.label}>Beg from:</label>
              <select
                className={styles.targetSelect}
                value={selectedTargetId}
                onChange={(e) => { setSelectedTargetId(e.target.value) }}
              >
                <option value=''>Select a player...</option>
                {eligibleTargets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (₽{p.rubles})
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.amountSelection}>
              <label className={styles.label}>Request amount:</label>
              <div className={styles.amountOptions}>
                <button
                  className={`${styles.amountButton} ${requestedAmount === 25 ? styles.selected : ''}`}
                  onClick={() => { setRequestedAmount(25) }}
                >
                  ₽25
                </button>
                <button
                  className={`${styles.amountButton} ${requestedAmount === 50 ? styles.selected : ''}`}
                  onClick={() => { setRequestedAmount(50) }}
                >
                  ₽50
                </button>
                <button
                  className={`${styles.amountButton} ${requestedAmount === 100 ? styles.selected : ''}`}
                  onClick={() => { setRequestedAmount(100) }}
                >
                  ₽100
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const target = players.find((p) => p.id === selectedTargetId)

  return (
    <div className={styles.overlay} onClick={(e) => { e.stopPropagation() }}>
      <div className={styles.modal} onClick={(e) => { e.stopPropagation() }}>
        <div className={styles.header}>
          <span className={styles.icon}>🍞</span>
          <h2 className={styles.title}>{target?.name}&apos;s Decision</h2>
          <span className={styles.icon}>🍞</span>
        </div>

        <div className={styles.content}>
          <p className={styles.description}>
            <strong>{player.name}</strong> (₽{player.rubles}) is starving and begging for ₽{requestedAmount}.
          </p>

          <div className={styles.targetInfo}>
            <p className={styles.targetLabel}><strong>{target?.name}</strong>, will you help?</p>
            <p className={styles.targetBalance}>Your Balance: ₽{target?.rubles}</p>
          </div>

          <div className={styles.decisionButtons}>
            <button
              className={styles.grantButton}
              onClick={() => { handleBeg(true) }}
              disabled={(target == null) || target.rubles < requestedAmount}
            >
              <div className={styles.buttonIcon}>✅</div>
              <div className={styles.buttonText}>
                <div className={styles.buttonTitle}>GRANT</div>
                <div className={styles.buttonDesc}>Give ₽{requestedAmount}</div>
              </div>
            </button>

            <button className={styles.refuseButton} onClick={() => { handleBeg(false) }}>
              <div className={styles.buttonIcon}>❌</div>
              <div className={styles.buttonText}>
                <div className={styles.buttonTitle}>REFUSE</div>
                <div className={styles.buttonDesc}>Deny charity</div>
              </div>
            </button>
          </div>

          {(target != null) && target.rubles < requestedAmount && (
            <div className={styles.insufficientWarning}>
              You do not have ₽{requestedAmount} to give!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
