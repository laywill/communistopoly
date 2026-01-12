// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useGameStore } from '../../../store/gameStore'

describe('gameStore - Confession System', () => {
  const setupPlayers = () => {
    const { initializePlayers } = useGameStore.getState()
    initializePlayers([
      { name: 'Player 1', piece: 'sickle', isStalin: false },
      { name: 'Player 2', piece: 'hammer', isStalin: false },
      { name: 'Player 3', piece: 'redStar', isStalin: false },
      { name: 'Stalin', piece: null, isStalin: true }
    ])
  }

  beforeEach(() => {
    useGameStore.getState().resetGame()
    setupPlayers()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('submitConfession()', () => {
    it('should submit confession from prisoner in Gulag', () => {
      const { submitConfession, sendToGulag, players } = useGameStore.getState()
      const prisoner = players[0]

      // Send player to Gulag first
      sendToGulag(prisoner.id, 'campLabour')

      const confessionText = 'I confess to my crimes against the State and vow to reform.'
      submitConfession(prisoner.id, confessionText)

      const state = useGameStore.getState()
      expect(state.confessions.length).toBe(1)
      expect(state.confessions[0].prisonerId).toBe(prisoner.id)
      expect(state.confessions[0].confession).toBe(confessionText)
      expect(state.confessions[0].reviewed).toBe(false)
    })

    it('should generate unique confession ID', () => {
      const { submitConfession, sendToGulag, players } = useGameStore.getState()
      const prisoner = players[0]

      sendToGulag(prisoner.id, 'campLabour')

      const now = Date.now()
      vi.setSystemTime(now)

      submitConfession(prisoner.id, 'First confession')

      const state = useGameStore.getState()
      expect(state.confessions[0].id).toBe(`confession-${now.toString()}`)
    })

    it('should set confession timestamp', () => {
      const { submitConfession, sendToGulag, players } = useGameStore.getState()
      const prisoner = players[0]

      sendToGulag(prisoner.id, 'campLabour')

      const now = new Date()
      vi.setSystemTime(now)

      submitConfession(prisoner.id, 'My confession')

      const state = useGameStore.getState()
      expect(state.confessions[0].timestamp).toEqual(now)
    })

    it('should add log entry when confession is submitted', () => {
      const { submitConfession, sendToGulag, players } = useGameStore.getState()
      const prisoner = players[0]

      sendToGulag(prisoner.id, 'campLabour')

      const initialLogLength = useGameStore.getState().gameLog.length
      submitConfession(prisoner.id, 'My confession')

      const logs = useGameStore.getState().gameLog
      expect(logs.length).toBe(initialLogLength + 1)
      expect(logs[logs.length - 1].type).toBe('gulag')
      expect(logs[logs.length - 1].message).toContain(prisoner.name)
      expect(logs[logs.length - 1].message).toContain('submitted a rehabilitation confession')
      expect(logs[logs.length - 1].playerId).toBe(prisoner.id)
    })

    it('should set pending action for Stalin to review', () => {
      const { submitConfession, sendToGulag, players } = useGameStore.getState()
      const prisoner = players[0]

      sendToGulag(prisoner.id, 'campLabour')
      submitConfession(prisoner.id, 'My confession')

      const state = useGameStore.getState()
      expect(state.pendingAction).toBeDefined()
      expect(state.pendingAction?.type).toBe('review-confession')
      expect(state.pendingAction?.data?.confessionId).toBe(state.confessions[0].id)
    })

    it('should not allow confession from player not in Gulag', () => {
      const { submitConfession, players } = useGameStore.getState()
      const player = players[0]

      // Player is not in Gulag
      submitConfession(player.id, 'My confession')

      const state = useGameStore.getState()
      expect(state.confessions.length).toBe(0)
    })

    it('should allow multiple confessions from same prisoner', () => {
      const { submitConfession, sendToGulag, players } = useGameStore.getState()
      const prisoner = players[0]

      sendToGulag(prisoner.id, 'campLabour')

      submitConfession(prisoner.id, 'First confession')
      vi.advanceTimersByTime(1000)
      submitConfession(prisoner.id, 'Second confession')

      const state = useGameStore.getState()
      expect(state.confessions.length).toBe(2)
      expect(state.confessions[0].confession).toBe('First confession')
      expect(state.confessions[1].confession).toBe('Second confession')
    })

    it('should allow confessions from multiple prisoners', () => {
      const { submitConfession, sendToGulag, players } = useGameStore.getState()
      const prisoner1 = players[0]
      const prisoner2 = players[1]

      sendToGulag(prisoner1.id, 'campLabour')
      sendToGulag(prisoner2.id, 'campLabour')

      submitConfession(prisoner1.id, 'Confession from prisoner 1')
      vi.advanceTimersByTime(1000)
      submitConfession(prisoner2.id, 'Confession from prisoner 2')

      const state = useGameStore.getState()
      expect(state.confessions.length).toBe(2)
      expect(state.confessions[0].prisonerId).toBe(prisoner1.id)
      expect(state.confessions[1].prisonerId).toBe(prisoner2.id)
    })
  })

  describe('reviewConfession()', () => {
    it('should accept confession and release prisoner from Gulag', () => {
      const { submitConfession, reviewConfession, sendToGulag, players } = useGameStore.getState()
      const prisoner = players[0]

      sendToGulag(prisoner.id, 'campLabour')
      submitConfession(prisoner.id, 'I confess and will reform')

      const confessionId = useGameStore.getState().confessions[0].id
      reviewConfession(confessionId, true)

      const state = useGameStore.getState()
      const updatedPrisoner = state.players.find(p => p.id === prisoner.id)

      expect(updatedPrisoner?.inGulag).toBe(false)
      expect(updatedPrisoner?.gulagTurns).toBe(0)
    })

    it('should mark confession as reviewed when accepted', () => {
      const { submitConfession, reviewConfession, sendToGulag, players } = useGameStore.getState()
      const prisoner = players[0]

      sendToGulag(prisoner.id, 'campLabour')
      submitConfession(prisoner.id, 'My confession')

      const confessionId = useGameStore.getState().confessions[0].id
      reviewConfession(confessionId, true)

      const state = useGameStore.getState()
      const confession = state.confessions.find(c => c.id === confessionId)

      expect(confession?.reviewed).toBe(true)
      expect(confession?.accepted).toBe(true)
    })

    it('should add log entry when confession is accepted', () => {
      const { submitConfession, reviewConfession, sendToGulag, players } = useGameStore.getState()
      const prisoner = players[0]

      sendToGulag(prisoner.id, 'campLabour')
      submitConfession(prisoner.id, 'My confession')

      const confessionId = useGameStore.getState().confessions[0].id
      const initialLogLength = useGameStore.getState().gameLog.length

      reviewConfession(confessionId, true)

      const logs = useGameStore.getState().gameLog
      expect(logs.length).toBe(initialLogLength + 1)
      expect(logs[logs.length - 1].type).toBe('gulag')
      expect(logs[logs.length - 1].message).toContain('Stalin accepted')
      expect(logs[logs.length - 1].message).toContain(prisoner.name)
      expect(logs[logs.length - 1].message).toContain('released them from the Gulag')
      expect(logs[logs.length - 1].playerId).toBe(prisoner.id)
    })

    it('should reject confession and keep prisoner in Gulag', () => {
      const { submitConfession, reviewConfession, sendToGulag, players } = useGameStore.getState()
      const prisoner = players[0]

      sendToGulag(prisoner.id, 'campLabour')
      submitConfession(prisoner.id, 'My confession')

      const confessionId = useGameStore.getState().confessions[0].id
      reviewConfession(confessionId, false)

      const state = useGameStore.getState()
      const updatedPrisoner = state.players.find(p => p.id === prisoner.id)

      expect(updatedPrisoner?.inGulag).toBe(true)
    })

    it('should mark confession as reviewed when rejected', () => {
      const { submitConfession, reviewConfession, sendToGulag, players } = useGameStore.getState()
      const prisoner = players[0]

      sendToGulag(prisoner.id, 'campLabour')
      submitConfession(prisoner.id, 'My confession')

      const confessionId = useGameStore.getState().confessions[0].id
      reviewConfession(confessionId, false)

      const state = useGameStore.getState()
      const confession = state.confessions.find(c => c.id === confessionId)

      expect(confession?.reviewed).toBe(true)
      expect(confession?.accepted).toBe(false)
    })

    it('should add log entry when confession is rejected', () => {
      const { submitConfession, reviewConfession, sendToGulag, players } = useGameStore.getState()
      const prisoner = players[0]

      sendToGulag(prisoner.id, 'campLabour')
      submitConfession(prisoner.id, 'My confession')

      const confessionId = useGameStore.getState().confessions[0].id
      const initialLogLength = useGameStore.getState().gameLog.length

      reviewConfession(confessionId, false)

      const logs = useGameStore.getState().gameLog
      expect(logs.length).toBe(initialLogLength + 1)
      expect(logs[logs.length - 1].type).toBe('gulag')
      expect(logs[logs.length - 1].message).toContain('Stalin rejected')
      expect(logs[logs.length - 1].message).toContain(prisoner.name)
      expect(logs[logs.length - 1].message).toContain('remain in the Gulag')
      expect(logs[logs.length - 1].playerId).toBe(prisoner.id)
    })

    it('should clear pending action after review', () => {
      const { submitConfession, reviewConfession, sendToGulag, players } = useGameStore.getState()
      const prisoner = players[0]

      sendToGulag(prisoner.id, 'campLabour')
      submitConfession(prisoner.id, 'My confession')

      const confessionId = useGameStore.getState().confessions[0].id
      reviewConfession(confessionId, true)

      const state = useGameStore.getState()
      expect(state.pendingAction).toBeNull()
    })

    it('should not review already reviewed confession', () => {
      const { submitConfession, reviewConfession, sendToGulag, players } = useGameStore.getState()
      const prisoner = players[0]

      sendToGulag(prisoner.id, 'campLabour')
      submitConfession(prisoner.id, 'My confession')

      const confessionId = useGameStore.getState().confessions[0].id

      // First review - accept
      reviewConfession(confessionId, true)
      expect(useGameStore.getState().players.find(p => p.id === prisoner.id)?.inGulag).toBe(false)

      // Put player back in gulag
      sendToGulag(prisoner.id, 'campLabour')

      // Try to review again - should not work
      reviewConfession(confessionId, false)

      const state = useGameStore.getState()
      const updatedPrisoner = state.players.find(p => p.id === prisoner.id)

      // Should still be in Gulag (second review had no effect)
      expect(updatedPrisoner?.inGulag).toBe(true)
    })

    it('should handle invalid confession ID gracefully', () => {
      const { reviewConfession } = useGameStore.getState()
      const initialState = useGameStore.getState()

      reviewConfession('invalid-confession-id', true)

      const newState = useGameStore.getState()
      expect(newState.players).toEqual(initialState.players)
      expect(newState.confessions).toEqual(initialState.confessions)
    })

    it('should handle confession with invalid prisoner ID gracefully', () => {
      const { submitConfession, reviewConfession, sendToGulag, players } = useGameStore.getState()
      const prisoner = players[0]

      sendToGulag(prisoner.id, 'campLabour')
      submitConfession(prisoner.id, 'My confession')

      const confessionId = useGameStore.getState().confessions[0].id

      // Manually corrupt the confession to have invalid prisoner ID
      useGameStore.setState((state) => ({
        confessions: state.confessions.map(c =>
          c.id === confessionId ? { ...c, prisonerId: 'invalid-id' } : c
        )
      }))

      const initialPlayerState = useGameStore.getState().players

      reviewConfession(confessionId, true)

      const newState = useGameStore.getState()
      // Players should remain unchanged since prisoner wasn't found
      expect(newState.players).toEqual(initialPlayerState)
    })
  })
})
