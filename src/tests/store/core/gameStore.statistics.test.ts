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
})
