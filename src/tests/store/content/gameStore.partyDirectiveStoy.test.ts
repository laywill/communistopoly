// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../../../store/gameStore'
import { DirectiveCard } from '../../../data/partyDirectiveCards'

describe('gameStore - Party Directive: Go To Stoy', () => {
  const setupPlayers = () => {
    const { initializePlayers } = useGameStore.getState()
    initializePlayers([
      { name: 'Player 1', piece: 'sickle', isStalin: false },
      { name: 'Player 2', piece: 'hammer', isStalin: false },
      { name: 'Stalin', piece: null, isStalin: true }
    ])
  }

  beforeEach(() => {
    useGameStore.getState().resetGame()
    setupPlayers()
  })

  describe('ADVANCE TO STOY card effect', () => {
    it('should move player to position 0 (STOY)', () => {
      const { applyDirectiveEffect, players, updatePlayer } = useGameStore.getState()
      const player = players[0]

      // Move player away from STOY first
      updatePlayer(player.id, { position: 15 })

      const goToStoyCard: DirectiveCard = {
        id: 'pd-1',
        title: 'ADVANCE TO STOY',
        description: 'Report to checkpoint immediately. Pay travel tax if you pass.',
        effect: { type: 'move', destination: 0 }
      }

      applyDirectiveEffect(goToStoyCard, player.id)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player.id)
      expect(updatedPlayer?.position).toBe(0)
    })

    it('should trigger stoy-pilfer pending action when landing on STOY', () => {
      const { applyDirectiveEffect, players, updatePlayer } = useGameStore.getState()
      const player = players[0]

      // Move player away from STOY first
      updatePlayer(player.id, { position: 15 })

      const goToStoyCard: DirectiveCard = {
        id: 'pd-1',
        title: 'ADVANCE TO STOY',
        description: 'Report to checkpoint immediately. Pay travel tax if you pass.',
        effect: { type: 'move', destination: 0 }
      }

      applyDirectiveEffect(goToStoyCard, player.id)

      const state = useGameStore.getState()
      expect(state.pendingAction).not.toBeNull()
      expect(state.pendingAction?.type).toBe('stoy-pilfer')
    })

    it('should handle Stoy passing bonus when moving from position < 0', () => {
      const { applyDirectiveEffect, players, updatePlayer } = useGameStore.getState()
      const player = players[0]

      // Start player at position 25 (will pass STOY to get to 0)
      updatePlayer(player.id, { position: 25 })
      const playerAfterUpdate = useGameStore.getState().players.find(p => p.id === player.id)
      expect(playerAfterUpdate).toBeDefined()
      const initialRubles = playerAfterUpdate?.rubles ?? 0

      const goToStoyCard: DirectiveCard = {
        id: 'pd-1',
        title: 'ADVANCE TO STOY',
        description: 'Report to checkpoint immediately. Pay travel tax if you pass.',
        effect: { type: 'move', destination: 0 }
      }

      applyDirectiveEffect(goToStoyCard, player.id)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player.id)
      // Should have paid travel tax when passing STOY
      expect(updatedPlayer?.rubles).toBe(initialRubles - 200)
    })

    it('should resolve space for other move destinations (e.g., Breadline)', () => {
      const { applyDirectiveEffect, players } = useGameStore.getState()
      const player = players[0]

      const goToBreadlineCard: DirectiveCard = {
        id: 'pd-15',
        title: 'GO TO BREADLINE',
        description: 'Advance directly to Breadline. Collect from all players.',
        effect: { type: 'move', destination: 20 }
      }

      applyDirectiveEffect(goToBreadlineCard, player.id)

      const state = useGameStore.getState()
      const updatedPlayer = state.players.find(p => p.id === player.id)

      expect(updatedPlayer?.position).toBe(20)
      // Should trigger breadline-contribution pending action
      expect(state.pendingAction).not.toBeNull()
      expect(state.pendingAction?.type).toBe('breadline-contribution')
      expect(state.pendingAction?.data?.landingPlayerId).toBe(player.id)
    })

    it('should resolve space for moveRelative effects', () => {
      const { applyDirectiveEffect, players, updatePlayer } = useGameStore.getState()
      const player = players[0]

      // Position player at 37, moving back 3 will land on 34
      updatePlayer(player.id, { position: 37 })

      const goBackCard: DirectiveCard = {
        id: 'pd-9',
        title: 'GO BACK THREE SPACES',
        description: 'Administrative error. Return whence you came.',
        effect: { type: 'moveRelative', spaces: -3 }
      }

      applyDirectiveEffect(goBackCard, player.id)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player.id)
      expect(updatedPlayer?.position).toBe(34)

      // Position 34 should be a property or space that might trigger an action
      // At minimum, space should be resolved (not just position updated)
    })

    it('should resolve property purchase when landing on unowned property via directive', () => {
      const { applyDirectiveEffect, players } = useGameStore.getState()
      const player = players[0]

      // Move to Ministry of Love (position 19) via directive
      const advanceCard: DirectiveCard = {
        id: 'pd-8',
        title: 'ADVANCE TO MINISTRY OF LOVE',
        description: 'You are required for questioning.',
        effect: { type: 'move', destination: 19 }
      }

      applyDirectiveEffect(advanceCard, player.id)

      const state = useGameStore.getState()
      const updatedPlayer = state.players.find(p => p.id === player.id)

      expect(updatedPlayer?.position).toBe(19)
      // Should trigger property-purchase or quota-payment pending action
      expect(state.pendingAction).not.toBeNull()
      expect(['property-purchase', 'quota-payment']).toContain(state.pendingAction?.type)
    })
  })
})
