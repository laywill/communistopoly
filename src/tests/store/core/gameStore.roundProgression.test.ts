// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../../../store/gameStore'

describe('gameStore - Round Progression', () => {
  beforeEach(() => {
    // Reset store to clean state
    useGameStore.setState({
      gamePhase: 'welcome',
      players: [],
      heroesOfSovietUnion: [],
      gameLog: [],
      roundNumber: 1,
      denouncementsThisRound: []
    })
  })

  describe('incrementRound', () => {
    it('should increment round number by 1', () => {
      const { initializePlayers, incrementRound } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const initialRound = useGameStore.getState().roundNumber
      incrementRound()
      const newRound = useGameStore.getState().roundNumber

      expect(newRound).toBe(initialRound + 1)
    })

    it('should clear denouncements from previous round', () => {
      const { initializePlayers, incrementRound } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      const [player1, player2] = useGameStore.getState().players

      // Add some denouncements
      useGameStore.setState({
        denouncementsThisRound: [
          { id: 'test-denouncement-1', accuserId: player1.id, accusedId: player2.id, crime: 'Test crime', timestamp: new Date(), roundNumber: 1 }
        ]
      })

      expect(useGameStore.getState().denouncementsThisRound).toHaveLength(1)

      // Increment round should clear denouncements
      incrementRound()

      expect(useGameStore.getState().denouncementsThisRound).toHaveLength(0)
    })

    it('should reset KGB test preview counter for all players', () => {
      const { initializePlayers, updatePlayer, incrementRound } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      const [player1, player2] = useGameStore.getState().players

      // Set preview counters
      updatePlayer(player1.id, { kgbTestPreviewsUsedThisRound: 2 })
      updatePlayer(player2.id, { kgbTestPreviewsUsedThisRound: 1 })

      // Verify they're set
      expect(useGameStore.getState().players[0].kgbTestPreviewsUsedThisRound).toBe(2)
      expect(useGameStore.getState().players[1].kgbTestPreviewsUsedThisRound).toBe(1)

      // Increment round
      incrementRound()

      // Verify counters are reset
      expect(useGameStore.getState().players[0].kgbTestPreviewsUsedThisRound).toBe(0)
      expect(useGameStore.getState().players[1].kgbTestPreviewsUsedThisRound).toBe(0)
    })

    it('should not reset KGB test preview counter if already 0', () => {
      const { initializePlayers, incrementRound } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      // Player already has 0 previews used
      expect(useGameStore.getState().players[0].kgbTestPreviewsUsedThisRound).toBe(0)

      // Increment round (line 2810 should not be hit)
      incrementRound()

      // Still 0
      expect(useGameStore.getState().players[0].kgbTestPreviewsUsedThisRound).toBe(0)
    })
  })
})
