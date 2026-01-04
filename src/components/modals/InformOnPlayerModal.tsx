// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import React, { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { canBeDenouncedBy } from '../../utils/pieceAbilityUtils'
import styles from './Modal.module.css'

interface InformOnPlayerModalProps {
  informerId: string
}

export const InformOnPlayerModal: React.FC<InformOnPlayerModalProps> = ({ informerId }) => {
  const { players, stalinPlayerId, updatePlayer, sendToGulag, setPendingAction, addLogEntry } = useGameStore()
  const informer = players.find((p) => p.id === informerId)

  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null)
  const [accusation, setAccusation] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [verdict, setVerdict] = useState<'guilty' | 'innocent' | null>(null)

  if (informer == null) return null

  // Get eligible targets (not in Gulag, not eliminated, not Stalin, not self, can be denounced by informer)
  const eligibleTargets = players.filter(
    (p) => {
      if (p.id === informerId || p.id === stalinPlayerId || p.inGulag || p.isEliminated || p.isStalin) {
        return false
      }

      // Check Lenin piece ability protection
      const denouncementCheck = canBeDenouncedBy(p, informer)
      return denouncementCheck.allowed
    }
  )

  // Get players who are protected from denouncement
  const protectedPlayers = players.filter(
    (p) => {
      if (p.id === informerId || p.id === stalinPlayerId || p.inGulag || p.isEliminated || p.isStalin) {
        return false
      }

      // Check Lenin piece ability protection
      const denouncementCheck = canBeDenouncedBy(p, informer)
      return !denouncementCheck.allowed
    }
  )

  const handleSelectTarget = (targetId: string): void => {
    setSelectedTargetId(targetId)
  }

  const handleSubmit = (): void => {
    if (selectedTargetId == null || selectedTargetId === '' || accusation.trim() === '') return

    setSubmitted(true)

    // In a real implementation, this would pause for Stalin to judge
    // For now, we'll simulate with a confirmation dialog
    const target = players.find((p) => p.id === selectedTargetId)
    if (target == null) return

    const guilty = window.confirm(
      `STALIN'S JUDGMENT\n\n${informer.name} accuses ${target.name} of:\n"${accusation}"\n\nDoes Stalin find ${target.name} GUILTY?`
    )

    if (guilty) {
      setVerdict('guilty')

      // Swap places: informer released, accused goes to Gulag
      updatePlayer(informerId, {
        inGulag: false,
        gulagTurns: 0
      })

      sendToGulag(selectedTargetId, 'denouncementGuilty')

      addLogEntry({
        type: 'gulag',
        message: `${informer.name} informed on ${target.name}. Stalin found ${target.name} GUILTY. They have swapped places!`
      })

      // Close modal after delay
      setTimeout(() => {
        setPendingAction(null)
      }, 3000)
    } else {
      setVerdict('innocent')

      // Add 2 turns to informer's sentence
      updatePlayer(informerId, {
        gulagTurns: informer.gulagTurns + 2
      })

      addLogEntry({
        type: 'gulag',
        message: `${informer.name} falsely accused ${target.name}. Stalin found them INNOCENT. ${informer.name}'s sentence extended by 2 turns!`
      })

      // Close modal after delay
      setTimeout(() => {
        setPendingAction(null)
      }, 3000)
    }
  }

  const handleCancel = (): void => {
    setPendingAction(null)
  }

  // Result screens
  if (verdict === 'guilty') {
    const target = players.find((p) => p.id === selectedTargetId)
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modal} style={{ maxWidth: '500px' }}>
          <div className={styles.header} style={{ background: 'var(--color-military-olive)' }}>
            <h2>GUILTY!</h2>
          </div>
          <div className={styles.content} style={{ textAlign: 'center', padding: '32px' }}>
            <p style={{ fontSize: '48px', margin: '0 0 16px 0' }}>⚖️</p>
            <p style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
              Stalin has found {target?.name} GUILTY
            </p>
            <p style={{ fontSize: '16px', marginBottom: '16px' }}>
              You are released from the Gulag!
            </p>
            <p style={{ fontSize: '14px', color: 'var(--color-gulag-grey)' }}>
              {target?.name} takes your place in the Gulag.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (verdict === 'innocent') {
    const target = players.find((p) => p.id === selectedTargetId)
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modal} style={{ maxWidth: '500px' }}>
          <div className={styles.header} style={{ background: 'var(--color-blood-burgundy)' }}>
            <h2>INNOCENT!</h2>
          </div>
          <div className={styles.content} style={{ textAlign: 'center', padding: '32px' }}>
            <p style={{ fontSize: '48px', margin: '0 0 16px 0' }}>✗</p>
            <p style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
              Stalin has found {target?.name} INNOCENT
            </p>
            <p style={{ fontSize: '16px', marginBottom: '16px', color: 'var(--color-blood-burgundy)' }}>
              Your sentence has been extended by 2 turns!
            </p>
            <p style={{ fontSize: '14px', color: 'var(--color-gulag-grey)' }}>
              False accusations are not tolerated.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Main form
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal} style={{ maxWidth: '600px' }}>
        <div className={styles.header} style={{ background: 'var(--color-blood-burgundy)' }}>
          <h2>⚖️ INFORM ON COMRADE ⚖️</h2>
        </div>

        <div className={styles.content}>
          <div
            style={{
              background: 'var(--color-aged-white)',
              border: '2px solid var(--color-propaganda-black)',
              padding: '16px',
              marginBottom: '20px'
            }}
          >
            <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '14px' }}>
              Your Situation:
            </p>
            <p style={{ margin: '0', fontSize: '14px' }}>
              <strong>{informer.name}</strong> - Day {informer.gulagTurns + 1} in the Gulag
            </p>
          </div>

          <div
            style={{
              background: 'var(--color-aged-white)',
              border: '2px solid var(--color-warning-amber)',
              borderRadius: '4px',
              padding: '12px',
              marginBottom: '20px'
            }}
          >
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-propaganda-black)', fontWeight: 'bold' }}>
              ⚠️ WARNING
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', lineHeight: '1.5' }}>
              <strong style={{ color: 'var(--color-military-olive)' }}>If GUILTY:</strong> You swap places - you are
              freed, they go to Gulag
              <br />
              <strong style={{ color: 'var(--color-blood-burgundy)' }}>If INNOCENT:</strong> Your sentence is extended
              by 2 turns!
            </p>
          </div>

          {eligibleTargets.length === 0
            ? (
              <div style={{ textAlign: 'center', padding: '24px' }}>
                <p style={{ fontSize: '16px', color: 'var(--color-gulag-grey)' }}>
                  No eligible comrades to accuse.
                </p>
                <button onClick={handleCancel} className={styles.primaryButton} style={{ marginTop: '16px' }}>
                  Return to Gulag Options
                </button>
              </div>
              )
            : (
            <>
              {/* Target Selection */}
              <div style={{ marginBottom: '20px' }}>
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '14px',
                    marginBottom: '12px',
                    textTransform: 'uppercase'
                  }}
                >
                  Select Comrade to Accuse:
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                  {eligibleTargets.map((target) => (
                    <div
                      key={target.id}
                      onClick={() => { handleSelectTarget(target.id) }}
                      style={{
                        padding: '12px',
                        border:
                          selectedTargetId === target.id
                            ? '3px solid var(--color-soviet-red)'
                            : '2px solid var(--color-propaganda-black)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        background:
                          selectedTargetId === target.id ? 'var(--color-parchment)' : 'var(--color-aged-white)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: 'bold', fontSize: '15px' }}>{target.name}</p>
                          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--color-gulag-grey)' }}>
                            Rank: {getRankDisplayName(target.rank)} • ₽{target.rubles} • Props: {target.properties.length}
                          </p>
                        </div>
                        {selectedTargetId === target.id && (
                          <span style={{ fontSize: '20px', color: 'var(--color-soviet-red)' }}>✓</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Protected Players Info */}
              {protectedPlayers.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <div
                    style={{
                      background: 'rgba(212, 168, 75, 0.1)',
                      border: '2px solid var(--color-gold)',
                      borderRadius: '4px',
                      padding: '12px'
                    }}
                  >
                    <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--color-gold)', fontWeight: 'bold' }}>
                      🗿 PROTECTED COMRADES
                    </p>
                    <p style={{ margin: '0 0 8px 0', fontSize: '12px', lineHeight: '1.5' }}>
                      The following comrades cannot be denounced by you:
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {protectedPlayers.map((target) => {
                        const denouncementCheck = canBeDenouncedBy(target, informer)
                        return (
                          <div key={target.id} style={{ fontSize: '12px', color: 'var(--color-cream)' }}>
                            • <strong>{target.name}</strong> - {denouncementCheck.reason}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Accusation Input */}
              <div style={{ marginBottom: '20px' }}>
                <label
                  htmlFor='accusation'
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-display)',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    marginBottom: '8px',
                    textTransform: 'uppercase'
                  }}
                >
                  State Your Accusation:
                </label>
                <textarea
                  id='accusation'
                  value={accusation}
                  onChange={(e) => { setAccusation(e.target.value) }}
                  placeholder='Counter-revolutionary activities, hoarding resources, suspicious behavior, etc.'
                  maxLength={200}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontFamily: 'var(--font-body)',
                    fontSize: '14px',
                    border: '2px solid var(--color-propaganda-black)',
                    borderRadius: '4px',
                    resize: 'vertical'
                  }}
                />
                <p style={{ fontSize: '12px', color: 'var(--color-gulag-grey)', marginTop: '4px', textAlign: 'right' }}>
                  {accusation.length}/200 characters
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={handleCancel} className={styles.disabledButton} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={selectedTargetId == null || selectedTargetId === '' || accusation.trim() === '' || submitted}
                  className={
                    selectedTargetId != null && selectedTargetId !== '' && accusation.trim() !== '' && !submitted
                      ? styles.dangerButton
                      : styles.disabledButton
                  }
                  style={{ flex: 2 }}
                >
                  {submitted ? 'Awaiting Stalin\'s Judgment...' : 'Submit Accusation'}
                </button>
              </div>

              {selectedTargetId != null && selectedTargetId !== '' && accusation.trim() !== '' && (
                <div
                  style={{
                    marginTop: '16px',
                    padding: '12px',
                    background: 'rgba(196, 30, 58, 0.1)',
                    border: '2px solid var(--color-soviet-red)',
                    borderRadius: '4px'
                  }}
                >
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold' }}>Preview:</p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '14px', fontStyle: 'italic' }}>
                    &quot;{accusation}&quot;
                  </p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: 'var(--color-gulag-grey)' }}>
                    Accused: {selectedTargetId != null && selectedTargetId !== '' ? players.find((p) => p.id === selectedTargetId)?.name : ''}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function getRankDisplayName (rank: string): string {
  const rankNames: Record<string, string> = {
    proletariat: 'Proletariat',
    partyMember: 'Party Member',
    commissar: 'Commissar',
    innerCircle: 'Inner Circle'
  }
  return rankNames[rank] || rank
}
