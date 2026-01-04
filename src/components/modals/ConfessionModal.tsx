// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import './ConfessionModal.css'

interface ConfessionModalProps {
  prisonerId: string
  onClose: () => void
}

export default function ConfessionModal ({ prisonerId, onClose }: ConfessionModalProps): JSX.Element | null {
  const [confession, setConfession] = useState('')
  const submitConfession = useGameStore((state) => state.submitConfession)
  const prisoner = useGameStore((state) => state.players.find(p => p.id === prisonerId))

  if (prisoner == null) return null

  const handleSubmit = (): void => {
    if (confession.trim().length < 10) {
      alert('Your confession must be at least 10 characters long, Comrade!')
      return
    }

    submitConfession(prisonerId, confession)
    onClose()
  }

  return (
    <div className='modal-overlay'>
      <div className='confession-modal modal-content'>
        <div className='confession-header'>
          <h2>☭ REHABILITATION CONFESSION ☭</h2>
          <p className='confession-subtitle'>Write your confession to Stalin for review</p>
        </div>

        <div className='prisoner-info'>
          <span className='prisoner-piece'>{prisoner.piece}</span>
          <span className='prisoner-name'>Comrade {prisoner.name}</span>
          <span className='gulag-turns'>Gulag Turn {prisoner.gulagTurns}/10</span>
        </div>

        <div className='confession-instructions'>
          <p>As a prisoner in the Gulag, you have the opportunity to confess your counter-revolutionary actions and seek rehabilitation.</p>
          <p className='warning'>
            <strong>Note:</strong> Stalin will read your confession aloud. Write carefully - your fate rests in his hands.
          </p>
        </div>

        <div className='confession-input-section'>
          <label htmlFor='confession-text'>Your Confession:</label>
          <textarea
            id='confession-text'
            className='confession-textarea'
            value={confession}
            onChange={(e) => { setConfession(e.target.value) }}
            placeholder='I confess that I have been a traitor to the Party. I have committed counter-revolutionary acts and deserve re-education...'
            rows={8}
            maxLength={500}
          />
          <div className='character-count'>
            {confession.length}/500 characters
          </div>
        </div>

        <div className='modal-actions'>
          <button
            className='submit-button'
            onClick={handleSubmit}
            disabled={confession.trim().length < 10}
          >
            SUBMIT CONFESSION
          </button>
          <button className='cancel-button' onClick={onClose}>
            CANCEL
          </button>
        </div>
      </div>
    </div>
  )
}
