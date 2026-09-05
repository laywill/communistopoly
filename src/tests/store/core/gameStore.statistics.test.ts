// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../../../store/gameStore'

describe('gameStore - Statistics', () => {
  beforeEach(() => {
    // Reset store to clean state
    useGameStore.setState({
      gamePhase: 'welcome',
      players: [],
      heroesOfSovietUnion: [],
      gameLog: [],
      roundNumber: 1,
      stalinPlayerId: null
    })
  })

  describe('updatePlayerStat', () => {
    it('should not throw and should leave gameStatistics unchanged when called with an unknown player ID', () => {
      const { initializePlayers, updatePlayerStat } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const statisticsBefore = useGameStore.getState().gameStatistics

      expect(() => { updatePlayerStat('not-a-real-player-id', 'moneyEarned', 100) }).not.toThrow()

      expect(useGameStore.getState().gameStatistics).toEqual(statisticsBefore)
    })

    it('should not throw and should leave gameStatistics unchanged when called with Stalin\'s ID', () => {
      const { initializePlayers, updatePlayerStat } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Stalin', piece: null, isStalin: true }
      ])

      const stalinPlayer = useGameStore.getState().players.find(player => player.isStalin)
      if (!stalinPlayer) {
        throw new Error('Expected a Stalin player to exist')
      }
      const stalinId = stalinPlayer.id

      // Stalin never gets a playerStats entry (see gamePhaseSlice) - confirm
      // the premise of the regression before exercising the guard.
      expect(useGameStore.getState().gameStatistics.playerStats[stalinId]).toBeUndefined()

      const statisticsBefore = useGameStore.getState().gameStatistics

      expect(() => { updatePlayerStat(stalinId, 'moneyEarned', 100) }).not.toThrow()

      expect(useGameStore.getState().gameStatistics).toEqual(statisticsBefore)
    })

    it('should still update the stat for a known non-Stalin player', () => {
      const { initializePlayers, updatePlayerStat } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players
      const before = useGameStore.getState().gameStatistics.playerStats[player1.id].moneyEarned

      updatePlayerStat(player1.id, 'moneyEarned', 100)

      const after = useGameStore.getState().gameStatistics.playerStats[player1.id].moneyEarned
      expect(after).toBe(before + 100)
    })
  })

  describe('updateGlobalStat', () => {
    it('should increment totalDenouncements by the given amount', () => {
      const { initializePlayers, updateGlobalStat } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const before = useGameStore.getState().gameStatistics.totalDenouncements

      updateGlobalStat('totalDenouncements', 1)

      expect(useGameStore.getState().gameStatistics.totalDenouncements).toBe(before + 1)
    })

    it('should increment totalTribunals by the given amount', () => {
      const { initializePlayers, updateGlobalStat } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const before = useGameStore.getState().gameStatistics.totalTribunals

      updateGlobalStat('totalTribunals', 1)

      expect(useGameStore.getState().gameStatistics.totalTribunals).toBe(before + 1)
    })

    it('should increment totalGulagSentences and totalTurns independently', () => {
      const { initializePlayers, updateGlobalStat } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const before = useGameStore.getState().gameStatistics

      updateGlobalStat('totalGulagSentences', 2)
      updateGlobalStat('totalTurns', 3)

      const after = useGameStore.getState().gameStatistics
      expect(after.totalGulagSentences).toBe(before.totalGulagSentences + 2)
      expect(after.totalTurns).toBe(before.totalTurns + 3)
      // Unrelated counters must be untouched by the calls above
      expect(after.totalDenouncements).toBe(before.totalDenouncements)
      expect(after.totalTribunals).toBe(before.totalTribunals)
    })

    it('should not mutate the previous gameStatistics object (immutability)', () => {
      const { initializePlayers, updateGlobalStat } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const before = useGameStore.getState().gameStatistics

      updateGlobalStat('totalTribunals', 1)

      const after = useGameStore.getState().gameStatistics
      expect(after).not.toBe(before)
      expect(before.totalTribunals).not.toBe(after.totalTribunals)
    })

    it('should support decrementing via a negative increment', () => {
      const { initializePlayers, updateGlobalStat } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      updateGlobalStat('totalTurns', 5)
      const before = useGameStore.getState().gameStatistics.totalTurns

      updateGlobalStat('totalTurns', -2)

      expect(useGameStore.getState().gameStatistics.totalTurns).toBe(before - 2)
    })
  })
})
