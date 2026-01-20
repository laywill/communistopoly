// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../../../store/gameStore'
import { PARTY_DIRECTIVE_CARDS } from '../../../data/partyDirectiveCards'

describe('gameStore - Take The Train Party Directive', () => {
  const setupPlayers = () => {
    const { initializePlayers, initializeProperties } = useGameStore.getState()
    initializePlayers([
      { name: 'Player 1', piece: 'sickle', isStalin: false },
      { name: 'Player 2', piece: 'hammer', isStalin: false },
      { name: 'Stalin', piece: null, isStalin: true }
    ])
    initializeProperties()
  }

  beforeEach(() => {
    useGameStore.getState().resetGame()
    setupPlayers()
  })

  const takeTheTrainCard = PARTY_DIRECTIVE_CARDS.find(
    card => card.title === 'ADVANCE TO NEAREST RAILWAY'
  )

  if (takeTheTrainCard === undefined) {
    throw new Error('Take The Train card not found in PARTY_DIRECTIVE_CARDS')
  }

  // Railway positions on the board: 5, 15, 25, 35

  describe('ADVANCE TO NEAREST RAILWAY card', () => {
    it('should move player from position 0 to railway at position 5', () => {
      const { applyDirectiveEffect, updatePlayer } = useGameStore.getState()
      const player = useGameStore.getState().players[0]

      // Place player at position 0 (STOY)
      updatePlayer(player.id, { position: 0 })

      applyDirectiveEffect(takeTheTrainCard, player.id)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player.id)
      expect(updatedPlayer?.position).toBe(5)
    })

    it('should move player from position 7 to railway at position 15', () => {
      const { applyDirectiveEffect, updatePlayer } = useGameStore.getState()
      const player = useGameStore.getState().players[0]

      // Place player at position 7
      updatePlayer(player.id, { position: 7 })

      applyDirectiveEffect(takeTheTrainCard, player.id)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player.id)
      expect(updatedPlayer?.position).toBe(15)
    })

    it('should move player from position 16 to railway at position 25', () => {
      const { applyDirectiveEffect, updatePlayer } = useGameStore.getState()
      const player = useGameStore.getState().players[0]

      // Place player at position 16
      updatePlayer(player.id, { position: 16 })

      applyDirectiveEffect(takeTheTrainCard, player.id)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player.id)
      expect(updatedPlayer?.position).toBe(25)
    })

    it('should move player from position 27 to railway at position 35', () => {
      const { applyDirectiveEffect, updatePlayer } = useGameStore.getState()
      const player = useGameStore.getState().players[0]

      // Place player at position 27
      updatePlayer(player.id, { position: 27 })

      applyDirectiveEffect(takeTheTrainCard, player.id)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player.id)
      expect(updatedPlayer?.position).toBe(35)
    })

    it('should wrap around and move player from position 38 to railway at position 5', () => {
      const { applyDirectiveEffect, updatePlayer } = useGameStore.getState()
      const player = useGameStore.getState().players[0]

      // Place player at position 38
      updatePlayer(player.id, { position: 38 })

      applyDirectiveEffect(takeTheTrainCard, player.id)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player.id)
      expect(updatedPlayer?.position).toBe(5)
    })

    it('should stay at railway if already on one (position 5)', () => {
      const { applyDirectiveEffect, updatePlayer } = useGameStore.getState()
      const player = useGameStore.getState().players[0]

      // Place player at position 5 (already on a railway)
      updatePlayer(player.id, { position: 5 })

      applyDirectiveEffect(takeTheTrainCard, player.id)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player.id)
      // Should advance to next railway (15)
      expect(updatedPlayer?.position).toBe(15)
    })

    it('should set pending action for property purchase if railway is unowned', () => {
      const { applyDirectiveEffect, updatePlayer } = useGameStore.getState()
      const player = useGameStore.getState().players[0]

      // Place player at position 0
      updatePlayer(player.id, { position: 0 })

      // Ensure railway at position 5 is unowned
      const property = useGameStore.getState().properties.find(p => p.spaceId === 5)
      expect(property?.custodianId).toBeNull()

      applyDirectiveEffect(takeTheTrainCard, player.id)

      const state = useGameStore.getState()
      expect(state.pendingAction).toBeDefined()
      expect(state.pendingAction?.type).toBe('property-purchase')
      expect(state.pendingAction?.data).toEqual({
        spaceId: 5,
        playerId: player.id
      })
    })

    it('should charge railway fee if railway is owned by another player', () => {
      const { applyDirectiveEffect, updatePlayer, purchaseProperty } = useGameStore.getState()
      const players = useGameStore.getState().players
      const player1 = players[0]
      const player2 = players[1]

      // Player 2 owns the railway at position 5
      purchaseProperty(player2.id, 5, 200)

      // Place player 1 at position 0
      updatePlayer(player1.id, { position: 0 })

      const player1Before = useGameStore.getState().players.find(p => p.id === player1.id)
      const player2Before = useGameStore.getState().players.find(p => p.id === player2.id)

      expect(player1Before).toBeDefined()
      expect(player2Before).toBeDefined()

      const initialRubles = player1Before?.rubles ?? 0
      const player2InitialRubles = player2Before?.rubles ?? 0

      applyDirectiveEffect(takeTheTrainCard, player1.id)

      const state = useGameStore.getState()
      const updatedPlayer1 = state.players.find(p => p.id === player1.id)
      const updatedPlayer2 = state.players.find(p => p.id === player2.id)

      expect(updatedPlayer1).toBeDefined()
      expect(updatedPlayer2).toBeDefined()

      // Player 1 should be charged railway fee
      expect(updatedPlayer1?.rubles).toBeLessThan(initialRubles)
      // Player 2 should receive the fee
      expect(updatedPlayer2?.rubles).toBeGreaterThan(player2InitialRubles)
      // Player 1 should be at position 5
      expect(updatedPlayer1?.position).toBe(5)
    })

    it('should not charge fee if railway is owned by the current player', () => {
      const { applyDirectiveEffect, updatePlayer, purchaseProperty } = useGameStore.getState()
      const player = useGameStore.getState().players[0]

      // Player owns the railway at position 5
      purchaseProperty(player.id, 5, 200)

      // Place player at position 0
      updatePlayer(player.id, { position: 0 })

      const playerBefore = useGameStore.getState().players.find(p => p.id === player.id)
      expect(playerBefore).toBeDefined()

      const initialRubles = playerBefore?.rubles ?? 0

      applyDirectiveEffect(takeTheTrainCard, player.id)

      const state = useGameStore.getState()
      const updatedPlayer = state.players.find(p => p.id === player.id)

      expect(updatedPlayer).toBeDefined()

      // Player should not be charged (owns the railway)
      expect(updatedPlayer?.rubles).toBe(initialRubles)
      // Player should be at position 5
      expect(updatedPlayer?.position).toBe(5)
    })

    it('should handle passing STOY when moving to railway', () => {
      const { applyDirectiveEffect, updatePlayer } = useGameStore.getState()
      const player = useGameStore.getState().players[0]

      // Place player at position 38 (will wrap to position 5)
      updatePlayer(player.id, { position: 38 })

      const initialRubles = player.rubles

      applyDirectiveEffect(takeTheTrainCard, player.id)

      const state = useGameStore.getState()
      const updatedPlayer = state.players.find(p => p.id === player.id)

      expect(updatedPlayer).toBeDefined()

      // Player should pay ₽200 travel tax for passing STOY (not a bonus)
      expect(updatedPlayer?.rubles).toBe(initialRubles - 200)
      expect(updatedPlayer?.position).toBe(5)
    })

    it('should add log entry about moving to railway', () => {
      const { applyDirectiveEffect, updatePlayer } = useGameStore.getState()
      const player = useGameStore.getState().players[0]

      updatePlayer(player.id, { position: 0 })

      const initialLogLength = useGameStore.getState().gameLog.length

      applyDirectiveEffect(takeTheTrainCard, player.id)

      const logs = useGameStore.getState().gameLog
      // Should have log entry about drawing card
      expect(logs.length).toBeGreaterThan(initialLogLength)
      expect(logs[logs.length - 1].message).toContain('ADVANCE TO NEAREST RAILWAY')
    })
  })
})
