// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useGameStore } from '../../../store/gameStore'

describe('gameStore - Hero of Soviet Union', () => {
  beforeEach(() => {
    // Reset store to clean state
    useGameStore.setState({
      gamePhase: 'welcome',
      players: [],
      heroesOfSovietUnion: [],
      gameLog: [],
      roundNumber: 1
    })
  })

  describe('grantHeroOfSovietUnion', () => {
    it('should grant Hero of Soviet Union status to a player', () => {
      const { initializePlayers, grantHeroOfSovietUnion, isHeroOfSovietUnion } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const player = useGameStore.getState().players[0]
      grantHeroOfSovietUnion(player.id)

      expect(isHeroOfSovietUnion(player.id)).toBe(true)

      const state = useGameStore.getState()
      expect(state.heroesOfSovietUnion).toHaveLength(1)
      expect(state.heroesOfSovietUnion[0].playerId).toBe(player.id)
      expect(state.heroesOfSovietUnion[0].grantedAtRound).toBe(state.roundNumber)
      expect(state.heroesOfSovietUnion[0].expiresAtRound).toBe(state.roundNumber + 3)
    })

    it('should not grant duplicate Hero status if player is already a Hero', () => {
      const { initializePlayers, grantHeroOfSovietUnion } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const player = useGameStore.getState().players[0]

      // Grant hero status first time
      grantHeroOfSovietUnion(player.id)
      const heroesAfterFirst = useGameStore.getState().heroesOfSovietUnion
      expect(heroesAfterFirst).toHaveLength(1)

      // Try to grant again - should be rejected
      grantHeroOfSovietUnion(player.id)
      const heroesAfterSecond = useGameStore.getState().heroesOfSovietUnion
      expect(heroesAfterSecond).toHaveLength(1) // Still only 1 hero entry

      // Verify log message was added
      const gameLog = useGameStore.getState().gameLog
      const duplicateLog = gameLog.find(log =>
        log.message.includes('is already a Hero of the Soviet Union')
      )
      expect(duplicateLog).toBeDefined()
      expect(duplicateLog?.type).toBe('system')
    })

    it('should not grant Hero status to non-existent player', () => {
      const { initializePlayers, grantHeroOfSovietUnion } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const initialHeroes = useGameStore.getState().heroesOfSovietUnion

      // Try to grant to non-existent player ID
      grantHeroOfSovietUnion('non-existent-id')

      const afterHeroes = useGameStore.getState().heroesOfSovietUnion
      expect(afterHeroes).toEqual(initialHeroes) // No change
    })
  })

  describe('isHeroOfSovietUnion', () => {
    it('should return true for active hero', () => {
      const { initializePlayers, grantHeroOfSovietUnion, isHeroOfSovietUnion } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const player = useGameStore.getState().players[0]
      grantHeroOfSovietUnion(player.id)

      expect(isHeroOfSovietUnion(player.id)).toBe(true)
    })

    it('should return false for non-hero player', () => {
      const { initializePlayers, isHeroOfSovietUnion } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const player = useGameStore.getState().players[0]
      expect(isHeroOfSovietUnion(player.id)).toBe(false)
    })

    it('should return false for expired hero', () => {
      const { initializePlayers, grantHeroOfSovietUnion, isHeroOfSovietUnion } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const player = useGameStore.getState().players[0]
      grantHeroOfSovietUnion(player.id)

      // Verify hero is active
      expect(isHeroOfSovietUnion(player.id)).toBe(true)

      // Manually advance round number past expiration
      const state = useGameStore.getState()
      useGameStore.setState({ roundNumber: state.roundNumber + 3 })

      // Hero should now be expired
      expect(isHeroOfSovietUnion(player.id)).toBe(false)
    })

    it('should handle hero expiration correctly at exactly 3 rounds', () => {
      const { initializePlayers, grantHeroOfSovietUnion, isHeroOfSovietUnion } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const player = useGameStore.getState().players[0]
      const initialRound = useGameStore.getState().roundNumber

      grantHeroOfSovietUnion(player.id)

      // At round +1: still hero
      useGameStore.setState({ roundNumber: initialRound + 1 })
      expect(isHeroOfSovietUnion(player.id)).toBe(true)

      // At round +2: still hero
      useGameStore.setState({ roundNumber: initialRound + 2 })
      expect(isHeroOfSovietUnion(player.id)).toBe(true)

      // At round +3: expired (expiresAtRound > currentRound fails)
      useGameStore.setState({ roundNumber: initialRound + 3 })
      expect(isHeroOfSovietUnion(player.id)).toBe(false)
    })
  })
})

describe('gameStore - Turn & Game Flow', () => {
  beforeEach(() => {
    // Reset store to clean state
    useGameStore.setState({
      gamePhase: 'playing',
      players: [],
      gameLog: [],
      currentPlayerIndex: 0,
      turnPhase: 'pre-roll',
      doublesCount: 0,
      hasRolled: false,
      pendingAction: null
    })
  })

  describe('setTurnPhase', () => {
    it('should set turnPhase to pre-roll', () => {
      const { setTurnPhase } = useGameStore.getState()

      setTurnPhase('pre-roll')

      const state = useGameStore.getState()
      expect(state.turnPhase).toBe('pre-roll')
    })

    it('should set turnPhase to rolling', () => {
      const { setTurnPhase } = useGameStore.getState()

      setTurnPhase('rolling')

      const state = useGameStore.getState()
      expect(state.turnPhase).toBe('rolling')
    })

    it('should set turnPhase to moving', () => {
      const { setTurnPhase } = useGameStore.getState()

      setTurnPhase('moving')

      const state = useGameStore.getState()
      expect(state.turnPhase).toBe('moving')
    })

    it('should set turnPhase to resolving', () => {
      const { setTurnPhase } = useGameStore.getState()

      setTurnPhase('resolving')

      const state = useGameStore.getState()
      expect(state.turnPhase).toBe('resolving')
    })

    it('should set turnPhase to post-turn', () => {
      const { setTurnPhase } = useGameStore.getState()

      setTurnPhase('post-turn')

      const state = useGameStore.getState()
      expect(state.turnPhase).toBe('post-turn')
    })
  })

  describe('endTurn', () => {
    it('should cycle currentPlayerIndex with 2 players', () => {
      const { initializePlayers, endTurn } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      // Set to player 0's turn
      useGameStore.setState({ currentPlayerIndex: 0, doublesCount: 0 })

      endTurn()

      const state = useGameStore.getState()
      expect(state.currentPlayerIndex).toBe(1)
    })

    it('should wrap currentPlayerIndex to 0 with 2 players', () => {
      const { initializePlayers, endTurn } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      // Set to player 1's turn (last player)
      useGameStore.setState({ currentPlayerIndex: 1, doublesCount: 0 })

      endTurn()

      const state = useGameStore.getState()
      expect(state.currentPlayerIndex).toBe(0) // Wraps to first player
    })

    it('should cycle currentPlayerIndex with 3 players', () => {
      const { initializePlayers, endTurn } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false },
        { name: 'Player 3', piece: 'redStar', isStalin: false }
      ])

      // Set to player 0's turn
      useGameStore.setState({ currentPlayerIndex: 0, doublesCount: 0 })

      endTurn()

      let state = useGameStore.getState()
      expect(state.currentPlayerIndex).toBe(1)

      // End turn again
      endTurn()

      state = useGameStore.getState()
      expect(state.currentPlayerIndex).toBe(2)
    })

    it('should wrap currentPlayerIndex to 0 with 3 players', () => {
      const { initializePlayers, endTurn } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false },
        { name: 'Player 3', piece: 'redStar', isStalin: false }
      ])

      // Set to player 2's turn (last player)
      useGameStore.setState({ currentPlayerIndex: 2, doublesCount: 0 })

      endTurn()

      const state = useGameStore.getState()
      expect(state.currentPlayerIndex).toBe(0) // Wraps to first player
    })

    it('should reset turnPhase to pre-roll', () => {
      const { initializePlayers, endTurn } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      useGameStore.setState({
        currentPlayerIndex: 0,
        turnPhase: 'post-turn',
        doublesCount: 0
      })

      endTurn()

      const state = useGameStore.getState()
      expect(state.turnPhase).toBe('pre-roll')
    })

    it('should reset doublesCount to 0 when moving to next player', () => {
      const { initializePlayers, updatePlayer, endTurn } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      // Put player in gulag so they don't get another turn despite doubles
      updatePlayer(player1.id, { inGulag: true })

      useGameStore.setState({
        currentPlayerIndex: 0,
        doublesCount: 2
      })

      endTurn()

      const state = useGameStore.getState()
      expect(state.doublesCount).toBe(0)
      expect(state.currentPlayerIndex).toBe(1) // Moved to next player
    })

    it('should reset hasRolled to false', () => {
      const { initializePlayers, endTurn } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      useGameStore.setState({
        currentPlayerIndex: 0,
        hasRolled: true,
        doublesCount: 0
      })

      endTurn()

      const state = useGameStore.getState()
      expect(state.hasRolled).toBe(false)
    })

    it('should reset pendingAction to null', () => {
      const { initializePlayers, endTurn } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      useGameStore.setState({
        currentPlayerIndex: 0,
        pendingAction: { type: 'property-purchase', data: { spaceId: 3 } },
        doublesCount: 0
      })

      endTurn()

      const state = useGameStore.getState()
      expect(state.pendingAction).toBeNull()
    })

    it('should skip Stalin when advancing to next player', () => {
      const { initializePlayers, endTurn } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Stalin', piece: null, isStalin: true },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      // Player 1's turn ends, should skip Stalin and go to Player 2
      useGameStore.setState({ currentPlayerIndex: 0, doublesCount: 0 })

      endTurn()

      const state = useGameStore.getState()
      expect(state.currentPlayerIndex).toBe(2) // Skip Stalin at index 1
    })

    it('should skip eliminated players when advancing to next player', () => {
      const { initializePlayers, updatePlayer, endTurn } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false },
        { name: 'Player 3', piece: 'redStar', isStalin: false }
      ])

      const [, player2] = useGameStore.getState().players

      // Eliminate player 2
      updatePlayer(player2.id, { isEliminated: true })

      // Player 1's turn ends, should skip eliminated Player 2 and go to Player 3
      useGameStore.setState({ currentPlayerIndex: 0, doublesCount: 0 })

      endTurn()

      const state = useGameStore.getState()
      expect(state.currentPlayerIndex).toBe(2) // Skip eliminated player at index 1
    })

    it('should allow player in gulag to take their turn', () => {
      const { initializePlayers, updatePlayer, endTurn } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      const [, player2] = useGameStore.getState().players

      // Put player 2 in gulag
      updatePlayer(player2.id, { inGulag: true, gulagTurns: 1 })

      // Player 1's turn ends, should NOT skip gulag player
      useGameStore.setState({ currentPlayerIndex: 0, doublesCount: 0 })

      endTurn()

      const state = useGameStore.getState()
      expect(state.currentPlayerIndex).toBe(1) // Gulag players still get turns
    })

    it('should give player another turn if they rolled doubles and not in gulag', () => {
      const { initializePlayers, endTurn } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      // Player 1 rolled doubles
      useGameStore.setState({
        currentPlayerIndex: 0,
        doublesCount: 1,
        turnPhase: 'post-turn',
        hasRolled: true
      })

      endTurn()

      const state = useGameStore.getState()
      expect(state.currentPlayerIndex).toBe(0) // Same player
      expect(state.turnPhase).toBe('pre-roll')
      expect(state.hasRolled).toBe(false)
      expect(state.pendingAction).toBeNull()
    })

    it('should NOT give player another turn if they rolled doubles but are in gulag', () => {
      const { initializePlayers, updatePlayer, endTurn } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      // Player 1 rolled doubles but is in gulag
      updatePlayer(player1.id, { inGulag: true, gulagTurns: 1 })
      useGameStore.setState({
        currentPlayerIndex: 0,
        doublesCount: 1,
        turnPhase: 'post-turn'
      })

      endTurn()

      const state = useGameStore.getState()
      expect(state.currentPlayerIndex).toBe(1) // Move to next player
      expect(state.doublesCount).toBe(0)
    })

    it('should add log entry for next player turn', () => {
      const { initializePlayers, endTurn } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      const [, player2] = useGameStore.getState().players

      // Clear existing log entries
      useGameStore.setState({ gameLog: [], currentPlayerIndex: 0, doublesCount: 0 })

      endTurn()

      const state = useGameStore.getState()
      const turnLog = state.gameLog.find(log =>
        log.type === 'system' && log.message.includes("Player 2's turn")
      )

      expect(turnLog).toBeDefined()
      expect(turnLog?.playerId).toBe(player2.id)
    })

    it('should increment round when cycling back to first non-Stalin player', () => {
      const { initializePlayers, endTurn } = useGameStore.getState()

      initializePlayers([
        { name: 'Stalin', piece: null, isStalin: true },
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      const initialRound = useGameStore.getState().roundNumber

      // Player 2's turn (last player)
      useGameStore.setState({ currentPlayerIndex: 2, doublesCount: 0 })

      endTurn()

      // Should cycle back to Player 1 (first non-Stalin) and increment round
      const state = useGameStore.getState()
      expect(state.currentPlayerIndex).toBe(1)
      expect(state.roundNumber).toBe(initialRound + 1)
    })

    it('should skip multiple eliminated players in sequence', () => {
      const { initializePlayers, updatePlayer, endTurn } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false },
        { name: 'Player 3', piece: 'redStar', isStalin: false },
        { name: 'Player 4', piece: 'tank', isStalin: false }
      ])

      const [, player2, player3] = useGameStore.getState().players

      // Eliminate players 2 and 3
      updatePlayer(player2.id, { isEliminated: true })
      updatePlayer(player3.id, { isEliminated: true })

      // Player 1's turn ends, should skip both eliminated players and go to Player 4
      useGameStore.setState({ currentPlayerIndex: 0, doublesCount: 0 })

      endTurn()

      const state = useGameStore.getState()
      expect(state.currentPlayerIndex).toBe(3) // Skip players 2 and 3
    })
  })
})
