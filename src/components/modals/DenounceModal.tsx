// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import React, { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { canBeDenouncedBy } from '../../utils/pieceAbilityUtils'
import styles from './Modal.module.css'

interface DenounceModalProps {
  accuserId: string
  onClose: () => void
}

const PREDEFINED_CRIMES = [
  { value: 'counterRevolutionary', label: 'Counter-revolutionary activities' },
  { value: 'capitalistSympathies', label: 'Capitalist sympathies' },
  { value: 'hoarding', label: 'Hoarding resources' },
  { value: 'insufficientEnthusiasm', label: 'Insufficient enthusiasm' },
  { value: 'suspicious', label: 'Suspicious behavior' },
  { value: 'tooSuccessful', label: 'Being too successful' },
  { value: 'tooUnsuccessful', label: 'Being too unsuccessful' },
  { value: 'suspiciousLook', label: 'Having a suspicious look' },
  { value: 'notSuspiciousEnough', label: 'Not having a suspicious enough look' },
  { value: 'youKnow', label: '"You know what you did"' },
  { value: 'custom', label: 'Custom accusation...' }
]

export const DenounceModal: React.FC<DenounceModalProps> = ({ accuserId, onClose }) => {
  const { players, stalinPlayerId, initiateDenouncement, canPlayerDenounce } = useGameStore()
  const accuser = players.find((p) => p.id === accuserId)

  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null)
  const [selectedCrime, setSelectedCrime] = useState('')
  const [customCrime, setCustomCrime] = useState('')

  if (accuser == null) return null

  // Check if player can denounce this round
  const denounceCheck = canPlayerDenounce(accuserId)

  // Get eligible targets (not in Gulag, not eliminated, not Stalin, not self)
  const eligibleTargets = players.filter(
    (p) => {
      if (p.id === accuserId || p.id === stalinPlayerId || p.inGulag || p.isEliminated || p.isStalin) {
        return false
      }

      // Check piece ability protection
      const denouncementCheck = canBeDenouncedBy(p, accuser)
      return denouncementCheck.allowed
    }
  )

  // Get players who are protected
  const protectedPlayers = players.filter(
    (p) => {
      if (p.id === accuserId || p.id === stalinPlayerId || p.inGulag || p.isEliminated || p.isStalin) {
        return false
      }

      const denouncementCheck = canBeDenouncedBy(p, accuser)
      return !denouncementCheck.allowed
    }
  )

  const handleSubmit = (): void => {
    if (selectedTargetId == null || selectedCrime === '') return

    const crime = selectedCrime === 'custom' ? customCrime : PREDEFINED_CRIMES.find(c => c.value === selectedCrime)?.label ?? selectedCrime

    if (crime.trim() === '') return

    // Initiate denouncement (this will create a tribunal)
    initiateDenouncement(accuserId, selectedTargetId, crime)
    onClose()
  }

  const getFinalCrime = (): string => {
    if (selectedCrime === '') return ''
    if (selectedCrime === 'custom') return customCrime
    return PREDEFINED_CRIMES.find(c => c.value === selectedCrime)?.label ?? ''
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal} style={{ maxWidth: '600px' }}>
        <div className={styles.header} style={{ background: 'var(--color-blood-burgundy)' }}>
          <h2>⚖️ DENOUNCE A COMRADE ⚖️</h2>
        </div>

        <div className={styles.content}>
          {!denounceCheck.canDenounce ? (
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <div
                style={{
                  background: 'var(--color-aged-white)',
                  border: '2px solid var(--color-blood-burgundy)',
                  borderRadius: '4px',
                  padding: '16px',
                  marginBottom: '20px'
                }}
              >
                <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: 'var(--color-blood-burgundy)' }}>
                  ⚠️ CANNOT DENOUNCE
                </p>
                <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
                  {denounceCheck.reason}
                </p>
              </div>
              <button onClick={onClose} className={styles.primaryButton}>
                Close
              </button>
            </div>
          )
            : eligibleTargets.length === 0
              ? (
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <p style={{ fontSize: '16px', color: 'var(--color-gulag-grey)', marginBottom: '16px' }}>
                No eligible comrades to denounce at this time.
              </p>
              {protectedPlayers.length > 0 && (
                <div
                  style={{
                    background: 'rgba(212, 168, 75, 0.1)',
                    border: '2px solid var(--color-gold)',
                    borderRadius: '4px',
                    padding: '12px',
                    marginBottom: '16px'
                  }}
                >
                  <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--color-gold)', fontWeight: 'bold' }}>
                    🗿 PROTECTED COMRADES
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {protectedPlayers.map((target) => {
                      const denouncementCheck = canBeDenouncedBy(target, accuser)
                      return (
                        <div key={target.id} style={{ fontSize: '12px', color: 'var(--color-cream)' }}>
                          • <strong>{target.name}</strong> - {denouncementCheck.reason}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              <button onClick={onClose} className={styles.primaryButton}>
                Close
              </button>
            </div>
          ) : (
            <>
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
                  ⚠️ TRIBUNAL CONSEQUENCES
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', lineHeight: '1.5' }}>
                  <strong style={{ color: 'var(--color-military-olive)' }}>If GUILTY:</strong> Accused goes to Gulag, you receive ₽100 informant bonus
                  <br />
                  <strong style={{ color: 'var(--color-blood-burgundy)' }}>If INNOCENT:</strong> You lose one Party Rank for wasting the Party&apos;s time
                  <br />
                  <strong style={{ color: 'var(--color-blood-burgundy)' }}>If BOTH GUILTY:</strong> Both you and the accused go to Gulag
                </p>
              </div>

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
                      onClick={() => { setSelectedTargetId(target.id) }}
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

              {/* Crime Selection */}
              <div style={{ marginBottom: '20px' }}>
                <label
                  htmlFor='crime'
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-display)',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    marginBottom: '8px',
                    textTransform: 'uppercase'
                  }}
                >
                  Select Crime:
                </label>
                <select
                  id='crime'
                  value={selectedCrime}
                  onChange={(e) => { setSelectedCrime(e.target.value) }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontFamily: 'var(--font-body)',
                    fontSize: '14px',
                    border: '2px solid var(--color-propaganda-black)',
                    borderRadius: '4px'
                  }}
                >
                  <option value=''>-- Select a crime --</option>
                  {PREDEFINED_CRIMES.map((crime) => (
                    <option key={crime.value} value={crime.value}>
                      {crime.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Crime Input */}
              {selectedCrime === 'custom' && (
                <div style={{ marginBottom: '20px' }}>
                  <label
                    htmlFor='customCrime'
                    style={{
                      display: 'block',
                      fontFamily: 'var(--font-display)',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      marginBottom: '8px',
                      textTransform: 'uppercase'
                    }}
                  >
                    Describe the Crime:
                  </label>
                  <textarea
                    id='customCrime'
                    value={customCrime}
                    onChange={(e) => { setCustomCrime(e.target.value) }}
                    placeholder='State your custom accusation...'
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
                    {customCrime.length}/200 characters
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={onClose} className={styles.disabledButton} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={selectedTargetId == null || selectedCrime === '' || (selectedCrime === 'custom' && customCrime.trim() === '')}
                  className={
                    selectedTargetId != null && selectedCrime !== '' && (selectedCrime !== 'custom' || customCrime.trim() !== '')
                      ? styles.dangerButton
                      : styles.disabledButton
                  }
                  style={{ flex: 2 }}
                >
                  FILE DENOUNCEMENT
                </button>
              </div>

              {/* Preview */}
              {selectedTargetId != null && getFinalCrime() !== '' && (
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
                    &quot;I denounce {players.find((p) => p.id === selectedTargetId)?.name} for: {getFinalCrime()}&quot;
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
  return rankNames[rank] ?? rank
}
