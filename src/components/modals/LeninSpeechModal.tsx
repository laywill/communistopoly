// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import styles from './LeninSpeechModal.module.css'

interface LeninSpeechModalProps {
  leninPlayerId: string
  onClose: () => void
}

export function LeninSpeechModal ({ leninPlayerId, onClose }: LeninSpeechModalProps) {
  const players = useGameStore((state) => state.players)
  const leninSpeech = useGameStore((state) => state.leninSpeech)

  const [selectedApplauders, setSelectedApplauders] = useState<string[]>([])
  const [speechGiven, setSpeechGiven] = useState(false)

  const leninPlayer = players.find((p) => p.id === leninPlayerId)

  if (!leninPlayer) {
    return null
  }

  // Get all non-Stalin, non-Lenin, non-eliminated players
  const eligibleApplauders = players.filter(
    (p) => p.id !== leninPlayerId && !p.isStalin && !p.isEliminated
  )

  const toggleApplauder = (playerId: string) => {
    if (selectedApplauders.includes(playerId)) {
      setSelectedApplauders(selectedApplauders.filter((id) => id !== playerId))
    } else {
      setSelectedApplauders([...selectedApplauders, playerId])
    }
  }

  const handleGiveSpeech = () => {
    setSpeechGiven(true)
  }

  const handleCompleteSpeech = () => {
    leninSpeech(leninPlayerId, selectedApplauders)
    onClose()
  }

  const totalCollection = selectedApplauders.reduce((total, applauderId) => {
    const applauder = players.find((p) => p.id === applauderId)
    if (applauder) {
      return total + Math.min(100, applauder.rubles)
    }
    return total
  }, 0)

  return (
    <div className={styles.overlay} onClick={speechGiven ? undefined : onClose}>
      <div className={styles.modal} onClick={(e) => { e.stopPropagation() }}>
        <div className={styles.header}>
          <span className={styles.icon}>🗿</span>
          <h2 className={styles.title}>LENIN&apos;S INSPIRING SPEECH</h2>
          <span className={styles.icon}>🗿</span>
        </div>

        <div className={styles.content}>
          {!speechGiven ? (
            <>
              <p className={styles.description}>
                <strong>{leninPlayer.name}</strong>, you may give an <strong>inspiring speech</strong> to the
                assembled comrades. This ability can only be used <strong>once per game</strong>.
              </p>

              <div className={styles.instructions}>
                <h3>Instructions:</h3>
                <ol>
                  <li>Click &quot;GIVE SPEECH&quot; to begin your 30-second speech</li>
                  <li>Give your speech (30 seconds maximum)</li>
                  <li>Stalin will judge the sincerity of each player&apos;s applause</li>
                  <li>Select which players applauded sincerely</li>
                  <li>Collect ₽100 from each sincere applauder</li>
                </ol>
              </div>

              <div className={styles.readySection}>
                <p className={styles.readyText}>Ready to address the comrades?</p>
                <button className={styles.buttonSpeech} onClick={handleGiveSpeech}>
                  🗿 GIVE SPEECH
                </button>
              </div>
            </>
          ) : (
            <>
              <div className={styles.speechGiven}>
                <p className={styles.speechText}>
                  📣 <strong>{leninPlayer.name}</strong> has given their inspiring speech!
                </p>
                <p className={styles.instruction}>
                  Stalin, select which players applauded <strong>sincerely</strong>:
                </p>
              </div>

              <div className={styles.applauderList}>
                {eligibleApplauders.map((player) => {
                  const isSelected = selectedApplauders.includes(player.id)
                  const canAfford = player.rubles >= 100

                  return (
                    <button
                      key={player.id}
                      className={`${styles.applauderButton} ${isSelected ? styles.selected : ''}`}
                      onClick={() => { toggleApplauder(player.id) }}
                    >
                      <div className={styles.applauderInfo}>
                        <span className={styles.applauderName}>{player.name}</span>
                        <span className={styles.applauderRubles}>
                          {canAfford ? '₽100' : `₽${String(player.rubles)}`}
                        </span>
                      </div>
                      {isSelected && (
                        <div className={styles.checkmark}>✓</div>
                      )}
                    </button>
                  )
                })}
              </div>

              {selectedApplauders.length > 0 && (
                <div className={styles.summary}>
                  <p className={styles.summaryText}>
                    Total collection: <strong>₽{totalCollection}</strong> from{' '}
                    {selectedApplauders.length} applauder{selectedApplauders.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}

              <div className={styles.actions}>
                <button
                  className={styles.buttonComplete}
                  onClick={handleCompleteSpeech}
                  disabled={selectedApplauders.length === 0}
                >
                  COMPLETE SPEECH
                </button>
              </div>
            </>
          )}

          {!speechGiven && (
            <div className={styles.actions}>
              <button className={styles.buttonCancel} onClick={onClose}>
                CANCEL
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
