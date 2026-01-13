// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../../../store/gameStore'

describe('gameStore - Player & Property Initialization', () => {
  beforeEach(() => {
    // Reset store to clean state
    useGameStore.setState({
      gamePhase: 'welcome',
      players: [],
      properties: [],
      heroesOfSovietUnion: [],
      gameLog: [],
      roundNumber: 1,
      stateTreasury: 0,
      stalinPlayerId: null
    })
  })

  describe('initializePlayers', () => {
    it('should initialize players with correct IDs, names, and pieces', () => {
      const { initializePlayers } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false },
        { name: 'Stalin', piece: null, isStalin: true }
      ])

      const state = useGameStore.getState()
      expect(state.players).toHaveLength(3)

      // Check player 0
      expect(state.players[0].id).toBe('player-0')
      expect(state.players[0].name).toBe('Player 1')
      expect(state.players[0].piece).toBe('sickle')
      expect(state.players[0].isStalin).toBe(false)

      // Check player 1
      expect(state.players[1].id).toBe('player-1')
      expect(state.players[1].name).toBe('Player 2')
      expect(state.players[1].piece).toBe('hammer')
      expect(state.players[1].isStalin).toBe(false)

      // Check Stalin
      expect(state.players[2].id).toBe('player-2')
      expect(state.players[2].name).toBe('Stalin')
      expect(state.players[2].piece).toBe(null)
      expect(state.players[2].isStalin).toBe(true)
    })

    it('should initialize all players with 1500 rubles', () => {
      const { initializePlayers } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      const state = useGameStore.getState()
      state.players.forEach(player => {
        expect(player.rubles).toBe(1500)
      })
    })

    it('should set Stalin player ID correctly', () => {
      const { initializePlayers } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Stalin', piece: null, isStalin: true }
      ])

      const state = useGameStore.getState()
      expect(state.stalinPlayerId).toBe('player-1')
    })

    it('should calculate state treasury based on non-Stalin player count', () => {
      const { initializePlayers } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false },
        { name: 'Stalin', piece: null, isStalin: true }
      ])

      const state = useGameStore.getState()
      // 2 non-Stalin players * 1500 = 3000
      expect(state.stateTreasury).toBe(3000)
    })

    it('should initialize Red Star player as partyMember rank', () => {
      const { initializePlayers } = useGameStore.getState()

      initializePlayers([
        { name: 'Red Star Player', piece: 'redStar', isStalin: false },
        { name: 'Regular Player', piece: 'sickle', isStalin: false }
      ])

      const state = useGameStore.getState()
      const redStarPlayer = state.players.find(p => p.piece === 'redStar')
      const regularPlayer = state.players.find(p => p.piece === 'sickle')

      expect(redStarPlayer?.rank).toBe('partyMember')
      expect(regularPlayer?.rank).toBe('proletariat')
    })

    it('should set currentPlayerIndex to 1 (first non-Stalin player)', () => {
      const { initializePlayers } = useGameStore.getState()

      initializePlayers([
        { name: 'Stalin', piece: null, isStalin: true },
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      const state = useGameStore.getState()
      expect(state.currentPlayerIndex).toBe(1)
    })

    it('should initialize player statistics for non-Stalin players', () => {
      const { initializePlayers } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Stalin', piece: null, isStalin: true }
      ])

      const state = useGameStore.getState()
      expect(state.gameStatistics.playerStats['player-0']).toBeDefined()
      expect(state.gameStatistics.playerStats['player-0'].maxWealth).toBe(1500)
      expect(state.gameStatistics.playerStats['player-1']).toBeUndefined() // Stalin has no stats
    })

    it('should initialize all player properties correctly', () => {
      const { initializePlayers } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const state = useGameStore.getState()
      const player = state.players[0]

      expect(player.position).toBe(0)
      expect(player.properties).toEqual([])
      expect(player.inGulag).toBe(false)
      expect(player.gulagTurns).toBe(0)
      expect(player.isEliminated).toBe(false)
      expect(player.debt).toBeNull()
      expect(player.correctTestAnswers).toBe(0)
      expect(player.consecutiveFailedTests).toBe(0)
      expect(player.underSuspicion).toBe(false)
    })

    it('should automatically call initializeProperties', () => {
      const { initializePlayers } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const state = useGameStore.getState()
      expect(state.properties.length).toBeGreaterThan(0)
    })
  })

  describe('initializeProperties', () => {
    it('should initialize all property spaces', () => {
      const { initializeProperties } = useGameStore.getState()

      initializeProperties()

      const state = useGameStore.getState()
      // There are 28 properties total (properties, railways, utilities)
      expect(state.properties.length).toBe(28)
    })

    it('should initialize all properties with no custodian', () => {
      const { initializeProperties } = useGameStore.getState()

      initializeProperties()

      const state = useGameStore.getState()
      state.properties.forEach(property => {
        expect(property.custodianId).toBeNull()
      })
    })

    it('should initialize all properties with collectivizationLevel 0', () => {
      const { initializeProperties } = useGameStore.getState()

      initializeProperties()

      const state = useGameStore.getState()
      state.properties.forEach(property => {
        expect(property.collectivizationLevel).toBe(0)
      })
    })

    it('should initialize all properties as unmortgaged', () => {
      const { initializeProperties } = useGameStore.getState()

      initializeProperties()

      const state = useGameStore.getState()
      state.properties.forEach(property => {
        expect(property.mortgaged).toBe(false)
      })
    })

    it('should include property, railway, and utility spaces', () => {
      const { initializeProperties } = useGameStore.getState()

      initializeProperties()

      const state = useGameStore.getState()
      // Verify we have different types by checking specific known space IDs
      const hasProperty = state.properties.some(p => p.spaceId === 3) // Gulag Mines
      const hasRailway = state.properties.some(p => p.spaceId === 5) // Trans-Siberian Railway
      const hasUtility = state.properties.some(p => p.spaceId === 12) // Propaganda Ministry

      expect(hasProperty).toBe(true)
      expect(hasRailway).toBe(true)
      expect(hasUtility).toBe(true)
    })
  })

  describe('setPropertyCustodian', () => {
    beforeEach(() => {
      const { initializeProperties } = useGameStore.getState()
      initializeProperties()
    })

    it('should set custodian for a property', () => {
      const { setPropertyCustodian } = useGameStore.getState()

      setPropertyCustodian(3, 'player-1')

      const state = useGameStore.getState()
      const property = state.properties.find(p => p.spaceId === 3)
      expect(property?.custodianId).toBe('player-1')
    })

    it('should only update the specified property', () => {
      const { setPropertyCustodian } = useGameStore.getState()

      setPropertyCustodian(3, 'player-1')

      const state = useGameStore.getState()
      const otherProperties = state.properties.filter(p => p.spaceId !== 3)

      otherProperties.forEach(property => {
        expect(property.custodianId).toBeNull()
      })
    })

    it('should allow changing custodian', () => {
      const { setPropertyCustodian } = useGameStore.getState()

      setPropertyCustodian(3, 'player-1')
      setPropertyCustodian(3, 'player-2')

      const state = useGameStore.getState()
      const property = state.properties.find(p => p.spaceId === 3)
      expect(property?.custodianId).toBe('player-2')
    })
  })

  describe('updateCollectivizationLevel', () => {
    beforeEach(() => {
      const { initializeProperties } = useGameStore.getState()
      initializeProperties()
    })

    it('should update collectivization level for a property', () => {
      const { updateCollectivizationLevel } = useGameStore.getState()

      updateCollectivizationLevel(3, 3)

      const state = useGameStore.getState()
      const property = state.properties.find(p => p.spaceId === 3)
      expect(property?.collectivizationLevel).toBe(3)
    })

    it('should only update the specified property', () => {
      const { updateCollectivizationLevel } = useGameStore.getState()

      updateCollectivizationLevel(3, 5)

      const state = useGameStore.getState()
      const otherProperties = state.properties.filter(p => p.spaceId !== 3)

      otherProperties.forEach(property => {
        expect(property.collectivizationLevel).toBe(0)
      })
    })

    it('should allow updating collectivization level multiple times', () => {
      const { updateCollectivizationLevel } = useGameStore.getState()

      updateCollectivizationLevel(3, 2)
      updateCollectivizationLevel(3, 4)

      const state = useGameStore.getState()
      const property = state.properties.find(p => p.spaceId === 3)
      expect(property?.collectivizationLevel).toBe(4)
    })

    it('should handle level 0 (removing improvements)', () => {
      const { updateCollectivizationLevel } = useGameStore.getState()

      updateCollectivizationLevel(3, 3)
      updateCollectivizationLevel(3, 0)

      const state = useGameStore.getState()
      const property = state.properties.find(p => p.spaceId === 3)
      expect(property?.collectivizationLevel).toBe(0)
    })
  })
})
