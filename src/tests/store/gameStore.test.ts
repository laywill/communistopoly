// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore, calculateTotalWealth, initializePlayerStats } from '../../store/gameStore'
import type { Player, Property } from '../../types/game'

describe('gameStore - Helper Functions', () => {
  describe('calculateTotalWealth', () => {
    const createMockPlayer = (overrides?: Partial<Player>): Player => ({
      id: 'test-player-1',
      name: 'Test Player',
      piece: 'sickle',
      rank: 'proletariat',
      rubles: 1000,
      position: 0,
      properties: [],
      inGulag: false,
      gulagTurns: 0,
      isEliminated: false,
      isStalin: false,
      correctTestAnswers: 0,
      consecutiveFailedTests: 0,
      underSuspicion: false,
      skipNextTurn: false,
      usedRailwayGulagPower: false,
      hasUsedSiberianCampsGulag: false,
      kgbTestPreviewsUsedThisRound: 0,
      hasUsedMinistryTruthRewrite: false,
      hasUsedPravdaPressRevote: false,
      vouchingFor: null,
      vouchedByRound: null,
      debt: null,
      debtCreatedAtRound: null,
      hasUsedTankGulagImmunity: false,
      tankRequisitionUsedThisLap: false,
      lapsCompleted: 0,
      hasUsedSickleHarvest: false,
      sickleMotherlandForgotten: false,
      hasUsedLeninSpeech: false,
      hasUsedIronCurtainDisappear: false,
      hasFreeFromGulagCard: false,
      vodkaUseCount: 0,
      ironCurtainClaimedRubles: 0,
      owesFavourTo: [],
      ...overrides
    })

    it('should calculate wealth for player with only rubles', () => {
      const player = createMockPlayer({ rubles: 2500 })
      const properties: Property[] = []

      const wealth = calculateTotalWealth(player, properties)

      expect(wealth).toBe(2500)
    })

    it('should include unmortgaged property value at full base cost', () => {
      const player = createMockPlayer({
        rubles: 1000,
        properties: ['3']
      })

      const properties: Property[] = [
        {
          spaceId: 3,
          custodianId: player.id,
          collectivizationLevel: 0,
          mortgaged: false
        }
      ]

      // Space 3 is "Gulag Mines" with baseCost of 60
      const wealth = calculateTotalWealth(player, properties)

      expect(wealth).toBe(1060) // 1000 rubles + 60 base cost
    })

    it('should include mortgaged property value at 50% of base cost', () => {
      const player = createMockPlayer({
        rubles: 1000,
        properties: ['3']
      })

      const properties: Property[] = [
        {
          spaceId: 3,
          custodianId: player.id,
          collectivizationLevel: 0,
          mortgaged: true
        }
      ]

      // Space 3 is "Gulag Mines" with baseCost of 60, mortgaged = 30
      const wealth = calculateTotalWealth(player, properties)

      expect(wealth).toBe(1030) // 1000 rubles + 30 (50% of 60)
    })

    it('should include collectivization improvement values', () => {
      const player = createMockPlayer({
        rubles: 1000,
        properties: ['3']
      })

      const properties: Property[] = [
        {
          spaceId: 3,
          custodianId: player.id,
          collectivizationLevel: 3,
          mortgaged: false
        }
      ]

      // Space 3 base cost is 60, plus 3 levels * 50 = 150
      const wealth = calculateTotalWealth(player, properties)

      expect(wealth).toBe(1210) // 1000 + 60 + (3 * 50)
    })

    it('should subtract debt from total wealth', () => {
      const player = createMockPlayer({
        rubles: 1000,
        debt: {
          id: 'debt-1',
          debtorId: 'test-player-1',
          creditorId: 'state',
          amount: 300,
          createdAtRound: 1,
          reason: 'Property purchase'
        }
      })

      const properties: Property[] = []

      const wealth = calculateTotalWealth(player, properties)

      expect(wealth).toBe(700) // 1000 - 300
    })

    it('should handle multiple properties with mixed states', () => {
      const player = createMockPlayer({
        rubles: 2000,
        properties: ['3', '6'],
        debt: {
          id: 'debt-1',
          debtorId: 'test-player-1',
          creditorId: 'state',
          amount: 500,
          createdAtRound: 1,
          reason: 'Property purchase'
        }
      })

      const properties: Property[] = [
        {
          spaceId: 3,
          custodianId: player.id,
          collectivizationLevel: 2,
          mortgaged: false
        },
        {
          spaceId: 6,
          custodianId: player.id,
          collectivizationLevel: 1,
          mortgaged: true
        }
      ]

      // Space 3: base 60 + (2 * 50) = 160
      // Space 6: base 100 * 0.5 (mortgaged) + (1 * 50) = 100
      // Total: 2000 + 160 + 100 - 500 = 1760
      const wealth = calculateTotalWealth(player, properties)

      expect(wealth).toBe(1760)
    })

    it('should handle property not found in properties array', () => {
      const player = createMockPlayer({
        rubles: 1000,
        properties: ['999'] // Non-existent property
      })

      const properties: Property[] = []

      const wealth = calculateTotalWealth(player, properties)

      expect(wealth).toBe(1000) // Only rubles counted
    })

    it('should handle negative wealth when debt exceeds assets', () => {
      const player = createMockPlayer({
        rubles: 500,
        debt: {
          id: 'debt-1',
          debtorId: 'test-player-1',
          creditorId: 'state',
          amount: 1500,
          createdAtRound: 1,
          reason: 'Large debt'
        }
      })

      const properties: Property[] = []

      const wealth = calculateTotalWealth(player, properties)

      expect(wealth).toBe(-1000) // 500 - 1500
    })
  })

  describe('initializePlayerStats', () => {
    it('should return correct initial stats structure', () => {
      const stats = initializePlayerStats()

      expect(stats).toEqual({
        turnsPlayed: 0,
        denouncementsMade: 0,
        denouncementsReceived: 0,
        tribunalsWon: 0,
        tribunalsLost: 0,
        totalGulagTurns: 0,
        gulagEscapes: 0,
        moneyEarned: 0,
        moneySpent: 0,
        propertiesOwned: 0,
        maxWealth: 1500,
        testsPassed: 0,
        testsFailed: 0
      })
    })

    it('should return a new object each time', () => {
      const stats1 = initializePlayerStats()
      const stats2 = initializePlayerStats()

      expect(stats1).not.toBe(stats2)
      expect(stats1).toEqual(stats2)
    })

    it('should have maxWealth set to 1500', () => {
      const stats = initializePlayerStats()

      expect(stats.maxWealth).toBe(1500)
    })

    it('should have all counters initialized to 0 except maxWealth', () => {
      const stats = initializePlayerStats()
      const entries = Object.entries(stats)

      const zeroEntries = entries.filter(([key]) => key !== 'maxWealth')

      zeroEntries.forEach(([key, value]) => {
        expect(value).toBe(0)
      })
    })
  })
})

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
          { denouncer: player1.id, denounced: player2.id }
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
