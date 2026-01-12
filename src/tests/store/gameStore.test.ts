// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { describe, it, expect, beforeEach, vi } from 'vitest'
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

describe('gameStore - Dice Rolling & Movement', () => {
  beforeEach(() => {
    // Reset store to clean state
    useGameStore.setState({
      gamePhase: 'playing',
      players: [],
      properties: [],
      gameLog: [],
      dice: [0, 0],
      isRolling: false,
      hasRolled: false,
      turnPhase: 'pre-roll',
      doublesCount: 0,
      currentPlayerIndex: 0,
      pendingAction: null
    })

    // Initialize players
    const { initializePlayers } = useGameStore.getState()
    initializePlayers([
      { name: 'Player 1', piece: 'sickle', isStalin: false },
      { name: 'Player 2', piece: 'hammer', isStalin: false }
    ])
  })

  describe('rollDice', () => {
    it('should roll dice with values between 1 and 6', () => {
      const { rollDice } = useGameStore.getState()

      rollDice()

      const state = useGameStore.getState()
      const [die1, die2] = state.dice

      expect(die1).toBeGreaterThanOrEqual(1)
      expect(die1).toBeLessThanOrEqual(6)
      expect(die2).toBeGreaterThanOrEqual(1)
      expect(die2).toBeLessThanOrEqual(6)
    })

    it('should update dice state', () => {
      const mathRandomSpy = vi.spyOn(Math, 'random')
      mathRandomSpy.mockReturnValueOnce(0.5).mockReturnValueOnce(0.8)

      const { rollDice } = useGameStore.getState()
      rollDice()

      const state = useGameStore.getState()
      expect(state.dice).toEqual([4, 5]) // floor(0.5 * 6) + 1 = 4, floor(0.8 * 6) + 1 = 5

      mathRandomSpy.mockRestore()
    })

    it('should set hasRolled to true', () => {
      const { rollDice } = useGameStore.getState()

      rollDice()

      const state = useGameStore.getState()
      expect(state.hasRolled).toBe(true)
    })

    it('should set turnPhase to rolling', () => {
      const { rollDice } = useGameStore.getState()

      rollDice()

      const state = useGameStore.getState()
      expect(state.turnPhase).toBe('rolling')
    })

    it('should set isRolling to true', () => {
      const { rollDice } = useGameStore.getState()

      rollDice()

      const state = useGameStore.getState()
      expect(state.isRolling).toBe(true)
    })

    it('should add dice log entry', () => {
      const mathRandomSpy = vi.spyOn(Math, 'random')
      mathRandomSpy.mockReturnValueOnce(0.5).mockReturnValueOnce(0.8)

      const { rollDice } = useGameStore.getState()
      rollDice()

      const state = useGameStore.getState()
      const diceLog = state.gameLog.find(log => log.type === 'dice')

      expect(diceLog).toBeDefined()
      expect(diceLog?.message).toContain('Rolled 4 + 5 = 9')

      mathRandomSpy.mockRestore()
    })
  })

  describe('rollVodka3Dice', () => {
    beforeEach(() => {
      // Update current player to be vodka bottle piece
      const players = useGameStore.getState().players
      const currentIndex = useGameStore.getState().currentPlayerIndex
      useGameStore.setState({
        players: players.map((p, i) =>
          i === currentIndex ? { ...p, piece: 'vodkaBottle', vodkaUseCount: 0 } : p
        )
      })
    })

    it('should roll 3 dice and select best 2', () => {
      const mathRandomSpy = vi.spyOn(Math, 'random')
      // Roll 3, 5, 2 -> sorted descending: 5, 3, 2 -> best two: [5, 3]
      mathRandomSpy.mockReturnValueOnce(0.4).mockReturnValueOnce(0.7).mockReturnValueOnce(0.2)

      const { rollVodka3Dice } = useGameStore.getState()
      rollVodka3Dice()

      const state = useGameStore.getState()
      // floor(0.4 * 6) + 1 = 3, floor(0.7 * 6) + 1 = 5, floor(0.2 * 6) + 1 = 2
      // Sorted descending: [5, 3, 2] -> best two: [5, 3]
      expect(state.dice).toEqual([5, 3])

      mathRandomSpy.mockRestore()
    })

    it('should increment vodkaUseCount', () => {
      const { rollVodka3Dice } = useGameStore.getState()
      const currentIndex = useGameStore.getState().currentPlayerIndex
      const playerBefore = useGameStore.getState().players[currentIndex]
      const initialCount = playerBefore.vodkaUseCount

      rollVodka3Dice()

      const playerAfter = useGameStore.getState().players[currentIndex]
      expect(playerAfter.vodkaUseCount).toBe(initialCount + 1)
    })

    it('should set turnPhase to rolling', () => {
      const { rollVodka3Dice } = useGameStore.getState()

      rollVodka3Dice()

      const state = useGameStore.getState()
      expect(state.turnPhase).toBe('rolling')
    })

    it('should add detailed log entry showing all 3 dice', () => {
      const mathRandomSpy = vi.spyOn(Math, 'random')
      mathRandomSpy.mockReturnValueOnce(0.4).mockReturnValueOnce(0.7).mockReturnValueOnce(0.2)

      const { rollVodka3Dice } = useGameStore.getState()
      rollVodka3Dice()

      const state = useGameStore.getState()
      const diceLog = state.gameLog.find(log => log.type === 'dice' && log.message.includes('3 dice'))

      expect(diceLog).toBeDefined()
      expect(diceLog?.message).toContain('rolled 3 dice: 3, 5, 2')
      expect(diceLog?.message).toContain('Using best 2: 5 + 3 = 8')

      mathRandomSpy.mockRestore()
    })
  })

  describe('finishRolling', () => {
    it('should detect doubles and increment doublesCount', () => {
      const { rollDice, finishRolling } = useGameStore.getState()

      // Mock rolling doubles
      const mathRandomSpy = vi.spyOn(Math, 'random')
      mathRandomSpy.mockReturnValueOnce(0.5).mockReturnValueOnce(0.5)
      rollDice()

      finishRolling()

      const state = useGameStore.getState()
      expect(state.doublesCount).toBe(1)

      mathRandomSpy.mockRestore()
    })

    it('should reset doublesCount to 0 on non-doubles', () => {
      // Set initial doublesCount
      useGameStore.setState({ doublesCount: 1 })

      const { rollDice, finishRolling } = useGameStore.getState()

      // Mock rolling non-doubles
      const mathRandomSpy = vi.spyOn(Math, 'random')
      mathRandomSpy.mockReturnValueOnce(0.3).mockReturnValueOnce(0.7)
      rollDice()

      finishRolling()

      const state = useGameStore.getState()
      expect(state.doublesCount).toBe(0)

      mathRandomSpy.mockRestore()
    })

    it('should transition turnPhase from rolling to moving', () => {
      const { rollDice, finishRolling } = useGameStore.getState()

      const mathRandomSpy = vi.spyOn(Math, 'random')
      mathRandomSpy.mockReturnValueOnce(0.3).mockReturnValueOnce(0.7)
      rollDice()

      expect(useGameStore.getState().turnPhase).toBe('rolling')

      finishRolling()

      expect(useGameStore.getState().turnPhase).toBe('moving')

      mathRandomSpy.mockRestore()
    })

    it('should set isRolling to false', () => {
      const { rollDice, finishRolling } = useGameStore.getState()

      const mathRandomSpy = vi.spyOn(Math, 'random')
      mathRandomSpy.mockReturnValueOnce(0.3).mockReturnValueOnce(0.7)
      rollDice()

      expect(useGameStore.getState().isRolling).toBe(true)

      finishRolling()

      expect(useGameStore.getState().isRolling).toBe(false)

      mathRandomSpy.mockRestore()
    })

    it('should move player after rolling', () => {
      const { rollDice, finishRolling } = useGameStore.getState()
      const currentIndex = useGameStore.getState().currentPlayerIndex
      const player = useGameStore.getState().players[currentIndex]
      const initialPosition = player.position

      const mathRandomSpy = vi.spyOn(Math, 'random')
      mathRandomSpy.mockReturnValueOnce(0.3).mockReturnValueOnce(0.5)
      rollDice() // floor(0.3*6)+1=2, floor(0.5*6)+1=4, total=6

      finishRolling()

      const newPosition = useGameStore.getState().players[currentIndex].position
      expect(newPosition).toBe((initialPosition + 6) % 40)

      mathRandomSpy.mockRestore()
    })
  })

  describe('movePlayer', () => {
    it('should move player forward by specified spaces', () => {
      const { movePlayer } = useGameStore.getState()
      const player = useGameStore.getState().players[0]

      movePlayer(player.id, 5)

      const updatedPlayer = useGameStore.getState().players[0]
      expect(updatedPlayer.position).toBe(5)
    })

    it('should wrap position around board (modulo 40)', () => {
      const { updatePlayer, movePlayer } = useGameStore.getState()
      const player = useGameStore.getState().players[0]

      // Start at position 38
      updatePlayer(player.id, { position: 38 })

      // Move 5 spaces: 38 + 5 = 43 -> 43 % 40 = 3
      movePlayer(player.id, 5)

      const updatedPlayer = useGameStore.getState().players[0]
      expect(updatedPlayer.position).toBe(3)
    })

    it('should detect passing STOY and increment lapsCompleted', () => {
      const { updatePlayer, movePlayer } = useGameStore.getState()
      const player = useGameStore.getState().players[0]

      // Start at position 38, laps = 0
      updatePlayer(player.id, { position: 38, lapsCompleted: 0 })

      // Move 5 spaces: crosses STOY (position 0)
      movePlayer(player.id, 5)

      const updatedPlayer = useGameStore.getState().players[0]
      expect(updatedPlayer.lapsCompleted).toBe(1)
    })

    it('should not increment lapsCompleted when not passing STOY', () => {
      const { updatePlayer, movePlayer } = useGameStore.getState()
      const player = useGameStore.getState().players[0]

      // Start at position 10
      updatePlayer(player.id, { position: 10, lapsCompleted: 0 })

      // Move 5 spaces: no STOY pass
      movePlayer(player.id, 5)

      const updatedPlayer = useGameStore.getState().players[0]
      expect(updatedPlayer.lapsCompleted).toBe(0)
    })

    it('should add movement log entry', () => {
      const { movePlayer } = useGameStore.getState()
      const player = useGameStore.getState().players[0]

      movePlayer(player.id, 5)

      const state = useGameStore.getState()
      const movementLog = state.gameLog.find(log => log.type === 'movement' && log.message.includes('moved from'))

      expect(movementLog).toBeDefined()
      expect(movementLog?.playerId).toBe(player.id)
    })

    it('should reset tankRequisitionUsedThisLap when passing STOY', () => {
      const { updatePlayer, movePlayer } = useGameStore.getState()
      const player = useGameStore.getState().players[0]

      // Start at position 38 with tankRequisitionUsedThisLap = true
      updatePlayer(player.id, { position: 38, tankRequisitionUsedThisLap: true })

      // Move 5 spaces: crosses STOY
      movePlayer(player.id, 5)

      const updatedPlayer = useGameStore.getState().players[0]
      expect(updatedPlayer.tankRequisitionUsedThisLap).toBe(false)
    })
  })

  describe('finishMoving', () => {
    beforeEach(() => {
      // Initialize properties
      const { initializeProperties } = useGameStore.getState()
      initializeProperties()
    })

    it('should set turnPhase to resolving', () => {
      const { updatePlayer, finishMoving } = useGameStore.getState()
      const currentIndex = useGameStore.getState().currentPlayerIndex
      const player = useGameStore.getState().players[currentIndex]

      // Position player on an unowned property (space 3)
      updatePlayer(player.id, { position: 3 })

      // Set currentPlayerIndex to match the player we positioned
      useGameStore.setState({ currentPlayerIndex: currentIndex })

      finishMoving()

      const state = useGameStore.getState()
      expect(state.turnPhase).toBe('resolving')
    })

    it('should set pendingAction for unowned property', () => {
      const { updatePlayer, finishMoving } = useGameStore.getState()
      const currentIndex = useGameStore.getState().currentPlayerIndex
      const player = useGameStore.getState().players[currentIndex]

      // Position player on an unowned property (space 3)
      updatePlayer(player.id, { position: 3 })

      finishMoving()

      const state = useGameStore.getState()
      expect(state.pendingAction).toBeDefined()
      expect(state.pendingAction?.type).toBe('property-purchase')
      expect(state.pendingAction?.data?.spaceId).toBe(3)
    })

    it('should set pendingAction for quota payment on owned property', () => {
      const { updatePlayer, setPropertyCustodian, finishMoving } = useGameStore.getState()
      const players = useGameStore.getState().players
      const currentIndex = useGameStore.getState().currentPlayerIndex
      const player1 = players[currentIndex]
      const player2 = players[currentIndex === 0 ? 1 : 0]

      // Player 2 owns property at space 3
      setPropertyCustodian(3, player2.id)

      // Player 1 lands on player 2's property
      updatePlayer(player1.id, { position: 3 })

      finishMoving()

      const state = useGameStore.getState()
      expect(state.pendingAction).toBeDefined()
      expect(state.pendingAction?.type).toBe('quota-payment')
      expect(state.pendingAction?.data?.spaceId).toBe(3)
      expect(state.pendingAction?.data?.payerId).toBe(player1.id)
    })

    it('should set turnPhase to post-turn when landing on own property', () => {
      const { updatePlayer, setPropertyCustodian, finishMoving } = useGameStore.getState()
      const currentIndex = useGameStore.getState().currentPlayerIndex
      const player = useGameStore.getState().players[currentIndex]

      // Player owns property at space 3
      setPropertyCustodian(3, player.id)

      // Player lands on their own property
      updatePlayer(player.id, { position: 3 })

      finishMoving()

      const state = useGameStore.getState()
      expect(state.turnPhase).toBe('post-turn')
      expect(state.pendingAction).toBeNull()
    })

    it('should set pendingAction for Party Directive card space', () => {
      const { updatePlayer, finishMoving } = useGameStore.getState()
      const currentIndex = useGameStore.getState().currentPlayerIndex
      const player = useGameStore.getState().players[currentIndex]

      // Position player on Party Directive space (space 7)
      updatePlayer(player.id, { position: 7 })

      finishMoving()

      const state = useGameStore.getState()
      expect(state.pendingAction).toBeDefined()
      expect(state.pendingAction?.type).toBe('draw-party-directive')
      expect(state.pendingAction?.data?.playerId).toBe(player.id)
    })

    it('should set pendingAction for Communist Test card space', () => {
      const { updatePlayer, finishMoving } = useGameStore.getState()
      const currentIndex = useGameStore.getState().currentPlayerIndex
      const player = useGameStore.getState().players[currentIndex]

      // Position player on Communist Test space (space 2)
      updatePlayer(player.id, { position: 2 })

      finishMoving()

      const state = useGameStore.getState()
      expect(state.pendingAction).toBeDefined()
      expect(state.pendingAction?.type).toBe('draw-communist-test')
      expect(state.pendingAction?.data?.playerId).toBe(player.id)
    })

    it('should not charge quota on mortgaged property', () => {
      const { updatePlayer, setPropertyCustodian, finishMoving } = useGameStore.getState()
      const players = useGameStore.getState().players
      const currentIndex = useGameStore.getState().currentPlayerIndex
      const player1 = players[currentIndex]
      const player2 = players[currentIndex === 0 ? 1 : 0]

      // Player 2 owns property at space 3 and mortgages it
      setPropertyCustodian(3, player2.id)
      const property = useGameStore.getState().properties.find(p => p.spaceId === 3)
      if (property) {
        useGameStore.setState({
          properties: useGameStore.getState().properties.map(p =>
            p.spaceId === 3 ? { ...p, mortgaged: true } : p
          )
        })
      }

      // Player 1 lands on player 2's mortgaged property
      updatePlayer(player1.id, { position: 3 })

      finishMoving()

      const state = useGameStore.getState()
      expect(state.turnPhase).toBe('post-turn')
      expect(state.pendingAction).toBeNull()
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

      const [player1, player2, player3] = useGameStore.getState().players

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

      const [player1, player2] = useGameStore.getState().players

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
      const { initializePlayers, endTurn, incrementRound } = useGameStore.getState()

      // Spy on incrementRound to verify it's called
      const incrementRoundSpy = vi.spyOn(useGameStore.getState(), 'incrementRound')

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

      const [player1, player2, player3, player4] = useGameStore.getState().players

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

describe('gameStore - Gulag System', () => {
  beforeEach(() => {
    // Reset store to clean state
    useGameStore.setState({
      gamePhase: 'playing',
      players: [],
      gameLog: [],
      currentPlayerIndex: 0,
      turnPhase: 'pre-roll',
      pendingAction: null,
      vouchers: []
    })
  })

  describe('sendToGulag', () => {
    it('should send player to Gulag for enemyOfState', () => {
      const { initializePlayers, sendToGulag } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      sendToGulag(player1.id, 'enemyOfState', 'Test reason')

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.inGulag).toBe(true)
      expect(updatedPlayer?.gulagTurns).toBe(0)
      expect(updatedPlayer?.position).toBe(10)
    })

    it('should demote player when sent to Gulag', () => {
      const { initializePlayers, updatePlayer, sendToGulag } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      // Promote player to partyMember first
      updatePlayer(player1.id, { rank: 'partyMember' })

      sendToGulag(player1.id, 'enemyOfState', 'Test reason')

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.rank).toBe('proletariat')
    })

    it('should add gulag log entry', () => {
      const { initializePlayers, sendToGulag } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      // Clear log
      useGameStore.setState({ gameLog: [] })

      sendToGulag(player1.id, 'enemyOfState', 'Test reason')

      const state = useGameStore.getState()
      const gulagLog = state.gameLog.find(log => log.type === 'gulag')

      expect(gulagLog).toBeDefined()
      expect(gulagLog?.message).toContain('sent to Gulag')
      expect(gulagLog?.playerId).toBe(player1.id)
    })

    it('should set turnPhase to post-turn', () => {
      const { initializePlayers, sendToGulag } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      useGameStore.setState({ turnPhase: 'resolving' })

      sendToGulag(player1.id, 'enemyOfState', 'Test reason')

      const state = useGameStore.getState()
      expect(state.turnPhase).toBe('post-turn')
    })

    it('should block Hammer piece from player-initiated Gulag (denouncementGuilty)', () => {
      const { initializePlayers, sendToGulag } = useGameStore.getState()

      initializePlayers([
        { name: 'Hammer Player', piece: 'hammer', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      sendToGulag(player1.id, 'denouncementGuilty', 'Test reason')

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.inGulag).toBe(false)
      expect(updatedPlayer?.position).not.toBe(10)
    })

    it('should redirect Tank piece to nearest railway on first Gulag sentence', () => {
      const { initializePlayers, updatePlayer, sendToGulag } = useGameStore.getState()

      initializePlayers([
        { name: 'Tank Player', piece: 'tank', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      // Position player at space 7 (nearest railway is 5)
      updatePlayer(player1.id, { position: 7, hasUsedTankGulagImmunity: false })

      sendToGulag(player1.id, 'enemyOfState', 'Test reason')

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.inGulag).toBe(false)
      expect(updatedPlayer?.position).toBe(5) // Nearest railway
      expect(updatedPlayer?.hasUsedTankGulagImmunity).toBe(true)
    })

    it('should still demote Tank player even when redirected to railway', () => {
      const { initializePlayers, updatePlayer, sendToGulag } = useGameStore.getState()

      initializePlayers([
        { name: 'Tank Player', piece: 'tank', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      // Promote to partyMember
      updatePlayer(player1.id, { rank: 'partyMember', hasUsedTankGulagImmunity: false })

      sendToGulag(player1.id, 'enemyOfState', 'Test reason')

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.rank).toBe('proletariat') // Demoted
    })

    it('should send Tank player to Gulag after immunity is used', () => {
      const { initializePlayers, updatePlayer, sendToGulag } = useGameStore.getState()

      initializePlayers([
        { name: 'Tank Player', piece: 'tank', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      // Mark immunity as used
      updatePlayer(player1.id, { hasUsedTankGulagImmunity: true })

      sendToGulag(player1.id, 'enemyOfState', 'Test reason')

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.inGulag).toBe(true)
      expect(updatedPlayer?.position).toBe(10)
    })
  })

  describe('demotePlayer', () => {
    it('should demote partyMember to proletariat', () => {
      const { initializePlayers, updatePlayer, demotePlayer } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      updatePlayer(player1.id, { rank: 'partyMember' })

      demotePlayer(player1.id)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.rank).toBe('proletariat')
    })

    it('should demote commissar to partyMember', () => {
      const { initializePlayers, updatePlayer, demotePlayer } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      updatePlayer(player1.id, { rank: 'commissar' })

      demotePlayer(player1.id)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.rank).toBe('partyMember')
    })

    it('should demote innerCircle to commissar', () => {
      const { initializePlayers, updatePlayer, demotePlayer } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      updatePlayer(player1.id, { rank: 'innerCircle' })

      demotePlayer(player1.id)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.rank).toBe('commissar')
    })

    it('should not demote proletariat (already lowest rank)', () => {
      const { initializePlayers, demotePlayer } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      // Player is already proletariat by default
      expect(player1.rank).toBe('proletariat')

      demotePlayer(player1.id)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.rank).toBe('proletariat') // Still proletariat
    })

    it('should add rank log entry on demotion', () => {
      const { initializePlayers, updatePlayer, demotePlayer } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      updatePlayer(player1.id, { rank: 'partyMember' })

      // Clear log
      useGameStore.setState({ gameLog: [] })

      demotePlayer(player1.id)

      const state = useGameStore.getState()
      const rankLog = state.gameLog.find(log => log.type === 'rank')

      expect(rankLog).toBeDefined()
      expect(rankLog?.message).toContain('demoted to proletariat')
    })

    it('should eliminate Red Star player when demoted to proletariat', () => {
      const { initializePlayers, updatePlayer, demotePlayer } = useGameStore.getState()

      initializePlayers([
        { name: 'Red Star Player', piece: 'redStar', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      // Start as partyMember (Red Star starts here)
      expect(player1.rank).toBe('partyMember')

      demotePlayer(player1.id)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.rank).toBe('proletariat')
      expect(updatedPlayer?.isEliminated).toBe(true)
    })
  })

  describe('handleGulagTurn', () => {
    it('should increment gulagTurns for player in Gulag', () => {
      const { initializePlayers, updatePlayer, handleGulagTurn } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      updatePlayer(player1.id, { inGulag: true, gulagTurns: 0 })

      handleGulagTurn(player1.id)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.gulagTurns).toBe(1)
    })

    it('should add gulag turn log entry', () => {
      const { initializePlayers, updatePlayer, handleGulagTurn } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      updatePlayer(player1.id, { inGulag: true, gulagTurns: 2 })

      // Clear log
      useGameStore.setState({ gameLog: [] })

      handleGulagTurn(player1.id)

      const state = useGameStore.getState()
      const gulagLog = state.gameLog.find(log => log.type === 'gulag')

      expect(gulagLog).toBeDefined()
      expect(gulagLog?.message).toContain('begins turn 3 in the Gulag')
    })

    it('should set pendingAction for gulag escape choice', () => {
      const { initializePlayers, updatePlayer, handleGulagTurn } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      updatePlayer(player1.id, { inGulag: true, gulagTurns: 0 })

      handleGulagTurn(player1.id)

      const state = useGameStore.getState()
      expect(state.pendingAction?.type).toBe('gulag-escape-choice')
      expect(state.pendingAction?.data?.playerId).toBe(player1.id)
    })

    it('should not increment gulagTurns if player is not in Gulag', () => {
      const { initializePlayers, handleGulagTurn } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      // Player is not in Gulag
      expect(player1.inGulag).toBe(false)

      handleGulagTurn(player1.id)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.gulagTurns).toBe(0) // No change
    })
  })

  describe('checkFor10TurnElimination', () => {
    it('should eliminate player after 10 turns in Gulag', () => {
      const { initializePlayers, updatePlayer, checkFor10TurnElimination } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      updatePlayer(player1.id, { inGulag: true, gulagTurns: 10 })

      checkFor10TurnElimination(player1.id)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.isEliminated).toBe(true)
    })

    it('should not eliminate player before 10 turns', () => {
      const { initializePlayers, updatePlayer, checkFor10TurnElimination } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      updatePlayer(player1.id, { inGulag: true, gulagTurns: 9 })

      checkFor10TurnElimination(player1.id)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.isEliminated).toBe(false)
    })

    it('should not eliminate player not in Gulag', () => {
      const { initializePlayers, checkFor10TurnElimination } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      checkFor10TurnElimination(player1.id)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.isEliminated).toBe(false)
    })
  })

  describe('attemptGulagEscape', () => {
    describe('roll method', () => {
      it('should escape Gulag on successful doubles roll', () => {
        const { initializePlayers, updatePlayer, attemptGulagEscape } = useGameStore.getState()

        initializePlayers([
          { name: 'Player 1', piece: 'sickle', isStalin: false }
        ])

        const [player1] = useGameStore.getState().players

        updatePlayer(player1.id, { inGulag: true, gulagTurns: 1, position: 10 })

        // Set dice to double 6s (required for gulag turn 1)
        useGameStore.setState({ dice: [6, 6] })

        attemptGulagEscape(player1.id, 'roll')

        const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
        expect(updatedPlayer?.inGulag).toBe(false)
        expect(updatedPlayer?.gulagTurns).toBe(0)
      })

      it('should remain in Gulag on failed doubles roll', () => {
        const { initializePlayers, updatePlayer, attemptGulagEscape } = useGameStore.getState()

        initializePlayers([
          { name: 'Player 1', piece: 'sickle', isStalin: false }
        ])

        const [player1] = useGameStore.getState().players

        updatePlayer(player1.id, { inGulag: true, gulagTurns: 1 })

        // Set dice to non-doubles
        useGameStore.setState({ dice: [3, 5] })

        attemptGulagEscape(player1.id, 'roll')

        const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
        expect(updatedPlayer?.inGulag).toBe(true)
      })

      it('should set turnPhase to post-turn after escape attempt', () => {
        const { initializePlayers, updatePlayer, attemptGulagEscape } = useGameStore.getState()

        initializePlayers([
          { name: 'Player 1', piece: 'sickle', isStalin: false }
        ])

        const [player1] = useGameStore.getState().players

        updatePlayer(player1.id, { inGulag: true, gulagTurns: 1 })
        useGameStore.setState({ dice: [6, 6], turnPhase: 'resolving' })

        attemptGulagEscape(player1.id, 'roll')

        const state = useGameStore.getState()
        expect(state.turnPhase).toBe('post-turn')
        expect(state.pendingAction).toBeNull()
      })

      it('should add success log entry on successful escape', () => {
        const { initializePlayers, updatePlayer, attemptGulagEscape } = useGameStore.getState()

        initializePlayers([
          { name: 'Player 1', piece: 'sickle', isStalin: false }
        ])

        const [player1] = useGameStore.getState().players

        updatePlayer(player1.id, { inGulag: true, gulagTurns: 1 })
        useGameStore.setState({ dice: [6, 6], gameLog: [] })

        attemptGulagEscape(player1.id, 'roll')

        const state = useGameStore.getState()
        const escapeLog = state.gameLog.find(log =>
          log.type === 'gulag' && log.message.includes('escaped')
        )

        expect(escapeLog).toBeDefined()
      })

      it('should add failure log entry on failed escape', () => {
        const { initializePlayers, updatePlayer, attemptGulagEscape } = useGameStore.getState()

        initializePlayers([
          { name: 'Player 1', piece: 'sickle', isStalin: false }
        ])

        const [player1] = useGameStore.getState().players

        updatePlayer(player1.id, { inGulag: true, gulagTurns: 1 })
        useGameStore.setState({ dice: [3, 5], gameLog: [] })

        attemptGulagEscape(player1.id, 'roll')

        const state = useGameStore.getState()
        const failLog = state.gameLog.find(log =>
          log.type === 'gulag' && log.message.includes('failed')
        )

        expect(failLog).toBeDefined()
      })
    })

    describe('pay method', () => {
      it('should escape Gulag by paying 500 rubles', () => {
        const { initializePlayers, updatePlayer, attemptGulagEscape } = useGameStore.getState()

        initializePlayers([
          { name: 'Player 1', piece: 'sickle', isStalin: false }
        ])

        const [player1] = useGameStore.getState().players

        updatePlayer(player1.id, { inGulag: true, gulagTurns: 3, rubles: 1000 })

        attemptGulagEscape(player1.id, 'pay')

        const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
        expect(updatedPlayer?.inGulag).toBe(false)
        expect(updatedPlayer?.gulagTurns).toBe(0)
        expect(updatedPlayer?.rubles).toBe(500) // 1000 - 500
      })

      it('should demote player when paying to escape', () => {
        const { initializePlayers, updatePlayer, attemptGulagEscape } = useGameStore.getState()

        initializePlayers([
          { name: 'Player 1', piece: 'sickle', isStalin: false }
        ])

        const [player1] = useGameStore.getState().players

        updatePlayer(player1.id, {
          inGulag: true,
          gulagTurns: 3,
          rubles: 1000,
          rank: 'partyMember'
        })

        attemptGulagEscape(player1.id, 'pay')

        const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
        expect(updatedPlayer?.rank).toBe('proletariat')
      })

      it('should not escape if player has insufficient rubles', () => {
        const { initializePlayers, updatePlayer, attemptGulagEscape } = useGameStore.getState()

        initializePlayers([
          { name: 'Player 1', piece: 'sickle', isStalin: false }
        ])

        const [player1] = useGameStore.getState().players

        updatePlayer(player1.id, { inGulag: true, gulagTurns: 3, rubles: 400 })

        attemptGulagEscape(player1.id, 'pay')

        const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
        expect(updatedPlayer?.inGulag).toBe(true) // Still in Gulag
        expect(updatedPlayer?.rubles).toBe(400) // No change
      })

      it('should add treasury adjustment when paying', () => {
        const { initializePlayers, updatePlayer, attemptGulagEscape } = useGameStore.getState()

        initializePlayers([
          { name: 'Player 1', piece: 'sickle', isStalin: false }
        ])

        const [player1] = useGameStore.getState().players
        const initialTreasury = useGameStore.getState().stateTreasury

        updatePlayer(player1.id, { inGulag: true, gulagTurns: 3, rubles: 1000 })

        attemptGulagEscape(player1.id, 'pay')

        const state = useGameStore.getState()
        expect(state.stateTreasury).toBe(initialTreasury + 500)
      })
    })

    describe('card method', () => {
      it('should escape Gulag using Get Out card', () => {
        const { initializePlayers, updatePlayer, attemptGulagEscape } = useGameStore.getState()

        initializePlayers([
          { name: 'Player 1', piece: 'sickle', isStalin: false }
        ])

        const [player1] = useGameStore.getState().players

        updatePlayer(player1.id, {
          inGulag: true,
          gulagTurns: 5,
          hasFreeFromGulagCard: true
        })

        attemptGulagEscape(player1.id, 'card')

        const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
        expect(updatedPlayer?.inGulag).toBe(false)
        expect(updatedPlayer?.gulagTurns).toBe(0)
        expect(updatedPlayer?.hasFreeFromGulagCard).toBe(false)
      })

      it('should not escape if player has no card', () => {
        const { initializePlayers, updatePlayer, attemptGulagEscape } = useGameStore.getState()

        initializePlayers([
          { name: 'Player 1', piece: 'sickle', isStalin: false }
        ])

        const [player1] = useGameStore.getState().players

        updatePlayer(player1.id, {
          inGulag: true,
          gulagTurns: 5,
          hasFreeFromGulagCard: false
        })

        attemptGulagEscape(player1.id, 'card')

        const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
        expect(updatedPlayer?.inGulag).toBe(true) // Still in Gulag
      })

      it('should add log entry when using card', () => {
        const { initializePlayers, updatePlayer, attemptGulagEscape } = useGameStore.getState()

        initializePlayers([
          { name: 'Player 1', piece: 'sickle', isStalin: false }
        ])

        const [player1] = useGameStore.getState().players

        updatePlayer(player1.id, {
          inGulag: true,
          gulagTurns: 5,
          hasFreeFromGulagCard: true
        })

        useGameStore.setState({ gameLog: [] })

        attemptGulagEscape(player1.id, 'card')

        const state = useGameStore.getState()
        const cardLog = state.gameLog.find(log =>
          log.type === 'gulag' && log.message.includes('Get out of Gulag free')
        )

        expect(cardLog).toBeDefined()
      })
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

describe('gameStore - STOY & Special Mechanics', () => {
  beforeEach(() => {
    // Reset store to clean state
    useGameStore.setState({
      gamePhase: 'playing',
      players: [],
      gameLog: [],
      stateTreasury: 1000,
      turnPhase: 'pre-roll',
      pendingAction: null
    })
  })

  describe('handleStoyPassing', () => {
    it('should deduct 200 rubles travel tax from player', () => {
      const { initializePlayers, handleStoyPassing } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      handleStoyPassing(player1.id)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.rubles).toBe(1300) // 1500 - 200
    })

    it('should add 200 rubles to state treasury', () => {
      const { initializePlayers, handleStoyPassing } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players
      const initialTreasury = useGameStore.getState().stateTreasury

      handleStoyPassing(player1.id)

      const state = useGameStore.getState()
      expect(state.stateTreasury).toBe(initialTreasury + 200)
    })

    it('should add log entry for travel tax payment', () => {
      const { initializePlayers, handleStoyPassing } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      // Clear log
      useGameStore.setState({ gameLog: [] })

      handleStoyPassing(player1.id)

      const state = useGameStore.getState()
      const taxLog = state.gameLog.find(log =>
        log.type === 'payment' && log.message.includes('paid ₽200 travel tax at STOY')
      )

      expect(taxLog).toBeDefined()
      expect(taxLog?.playerId).toBe(player1.id)
    })

    it('should grant Hammer piece +50 rubles bonus when passing STOY', () => {
      const { initializePlayers, handleStoyPassing } = useGameStore.getState()

      initializePlayers([
        { name: 'Hammer Player', piece: 'hammer', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      handleStoyPassing(player1.id)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      // Net: -200 + 50 = -150 from initial 1500 = 1350
      expect(updatedPlayer?.rubles).toBe(1350)
    })

    it('should add log entry for Hammer bonus', () => {
      const { initializePlayers, handleStoyPassing } = useGameStore.getState()

      initializePlayers([
        { name: 'Hammer Player', piece: 'hammer', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      // Clear log
      useGameStore.setState({ gameLog: [] })

      handleStoyPassing(player1.id)

      const state = useGameStore.getState()
      const bonusLog = state.gameLog.find(log =>
        log.type === 'payment' && log.message.includes("Hammer earns +₽50 bonus at STOY")
      )

      expect(bonusLog).toBeDefined()
      expect(bonusLog?.playerId).toBe(player1.id)
    })

    it('should not grant bonus to non-Hammer pieces', () => {
      const { initializePlayers, handleStoyPassing } = useGameStore.getState()

      initializePlayers([
        { name: 'Sickle Player', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      // Clear log
      useGameStore.setState({ gameLog: [] })

      handleStoyPassing(player1.id)

      const state = useGameStore.getState()
      const bonusLog = state.gameLog.find(log =>
        log.message.includes("Hammer earns +₽50 bonus at STOY")
      )

      expect(bonusLog).toBeUndefined()

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.rubles).toBe(1300) // Only -200, no bonus
    })

    it('should handle non-existent player gracefully', () => {
      const { initializePlayers, handleStoyPassing } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const initialState = useGameStore.getState()

      // Try to call with non-existent player ID
      handleStoyPassing('non-existent-id')

      // State should remain unchanged
      const finalState = useGameStore.getState()
      expect(finalState.players).toEqual(initialState.players)
      expect(finalState.stateTreasury).toBe(initialState.stateTreasury)
    })
  })

  describe('handleStoyPilfer', () => {
    it('should successfully pilfer 100 rubles on dice roll >= 4', () => {
      const { initializePlayers, handleStoyPilfer } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players
      const initialRubles = player1.rubles

      handleStoyPilfer(player1.id, 6)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.rubles).toBe(initialRubles + 100)
    })

    it('should successfully pilfer on exactly dice roll 4', () => {
      const { initializePlayers, handleStoyPilfer } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players
      const initialRubles = player1.rubles

      handleStoyPilfer(player1.id, 4)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.rubles).toBe(initialRubles + 100)
    })

    it('should deduct 100 rubles from state treasury on successful pilfer', () => {
      const { initializePlayers, handleStoyPilfer } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players
      const initialTreasury = useGameStore.getState().stateTreasury

      handleStoyPilfer(player1.id, 6)

      const state = useGameStore.getState()
      expect(state.stateTreasury).toBe(initialTreasury - 100)
    })

    it('should add success log entry on successful pilfer', () => {
      const { initializePlayers, handleStoyPilfer } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      // Clear log
      useGameStore.setState({ gameLog: [] })

      handleStoyPilfer(player1.id, 6)

      const state = useGameStore.getState()
      const pilferLog = state.gameLog.find(log =>
        log.type === 'payment' && log.message.includes('successfully pilfered ₽100')
      )

      expect(pilferLog).toBeDefined()
      expect(pilferLog?.playerId).toBe(player1.id)
    })

    it('should send player to Gulag on dice roll < 4', () => {
      const { initializePlayers, handleStoyPilfer } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      handleStoyPilfer(player1.id, 3)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.inGulag).toBe(true)
      expect(updatedPlayer?.position).toBe(10)
    })

    it('should send player to Gulag on dice roll 1', () => {
      const { initializePlayers, handleStoyPilfer } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      handleStoyPilfer(player1.id, 1)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.inGulag).toBe(true)
    })

    it('should not change rubles when caught pilfering', () => {
      const { initializePlayers, handleStoyPilfer } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players
      const initialRubles = player1.rubles

      handleStoyPilfer(player1.id, 2)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.rubles).toBe(initialRubles)
    })

    it('should set turnPhase to post-turn', () => {
      const { initializePlayers, handleStoyPilfer } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      useGameStore.setState({ turnPhase: 'resolving' })

      handleStoyPilfer(player1.id, 6)

      const state = useGameStore.getState()
      expect(state.turnPhase).toBe('post-turn')
    })

    it('should set pendingAction to null', () => {
      const { initializePlayers, handleStoyPilfer } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      useGameStore.setState({ pendingAction: { type: 'stoy-pilfer', data: {} } })

      handleStoyPilfer(player1.id, 6)

      const state = useGameStore.getState()
      expect(state.pendingAction).toBeNull()
    })

    it('should handle non-existent player gracefully', () => {
      const { initializePlayers, handleStoyPilfer } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const initialState = useGameStore.getState()

      // Try to call with non-existent player ID
      handleStoyPilfer('non-existent-id', 6)

      // State should remain mostly unchanged (turnPhase still changes)
      const finalState = useGameStore.getState()
      expect(finalState.players).toEqual(initialState.players)
    })
  })

  describe('tankRequisition', () => {
    it('should requisition 50 rubles from target player', () => {
      const { initializePlayers, tankRequisition } = useGameStore.getState()

      initializePlayers([
        { name: 'Tank Player', piece: 'tank', isStalin: false },
        { name: 'Target Player', piece: 'sickle', isStalin: false }
      ])

      const [tankPlayer, targetPlayer] = useGameStore.getState().players

      tankRequisition(tankPlayer.id, targetPlayer.id)

      const updatedTarget = useGameStore.getState().players.find(p => p.id === targetPlayer.id)
      expect(updatedTarget?.rubles).toBe(1450) // 1500 - 50
    })

    it('should add 50 rubles to tank player', () => {
      const { initializePlayers, tankRequisition } = useGameStore.getState()

      initializePlayers([
        { name: 'Tank Player', piece: 'tank', isStalin: false },
        { name: 'Target Player', piece: 'sickle', isStalin: false }
      ])

      const [tankPlayer, targetPlayer] = useGameStore.getState().players

      tankRequisition(tankPlayer.id, targetPlayer.id)

      const updatedTank = useGameStore.getState().players.find(p => p.id === tankPlayer.id)
      expect(updatedTank?.rubles).toBe(1550) // 1500 + 50
    })

    it('should set tankRequisitionUsedThisLap to true', () => {
      const { initializePlayers, tankRequisition } = useGameStore.getState()

      initializePlayers([
        { name: 'Tank Player', piece: 'tank', isStalin: false },
        { name: 'Target Player', piece: 'sickle', isStalin: false }
      ])

      const [tankPlayer, targetPlayer] = useGameStore.getState().players

      expect(tankPlayer.tankRequisitionUsedThisLap).toBe(false)

      tankRequisition(tankPlayer.id, targetPlayer.id)

      const updatedTank = useGameStore.getState().players.find(p => p.id === tankPlayer.id)
      expect(updatedTank?.tankRequisitionUsedThisLap).toBe(true)
    })

    it('should add log entry for requisition', () => {
      const { initializePlayers, tankRequisition } = useGameStore.getState()

      initializePlayers([
        { name: 'Tank Player', piece: 'tank', isStalin: false },
        { name: 'Target Player', piece: 'sickle', isStalin: false }
      ])

      const [tankPlayer, targetPlayer] = useGameStore.getState().players

      // Clear log
      useGameStore.setState({ gameLog: [] })

      tankRequisition(tankPlayer.id, targetPlayer.id)

      const state = useGameStore.getState()
      const reqLog = state.gameLog.find(log =>
        log.type === 'payment' && log.message.includes("Tank requisitioned ₽50")
      )

      expect(reqLog).toBeDefined()
      expect(reqLog?.playerId).toBe(tankPlayer.id)
    })

    it('should requisition all money if target has less than 50 rubles', () => {
      const { initializePlayers, updatePlayer, tankRequisition } = useGameStore.getState()

      initializePlayers([
        { name: 'Tank Player', piece: 'tank', isStalin: false },
        { name: 'Target Player', piece: 'sickle', isStalin: false }
      ])

      const [tankPlayer, targetPlayer] = useGameStore.getState().players

      // Target has only 30 rubles
      updatePlayer(targetPlayer.id, { rubles: 30 })

      tankRequisition(tankPlayer.id, targetPlayer.id)

      const updatedTarget = useGameStore.getState().players.find(p => p.id === targetPlayer.id)
      const updatedTank = useGameStore.getState().players.find(p => p.id === tankPlayer.id)

      expect(updatedTarget?.rubles).toBe(0) // All taken
      expect(updatedTank?.rubles).toBe(1530) // 1500 + 30
    })

    it('should not requisition if tank player already used ability this lap', () => {
      const { initializePlayers, updatePlayer, tankRequisition } = useGameStore.getState()

      initializePlayers([
        { name: 'Tank Player', piece: 'tank', isStalin: false },
        { name: 'Target Player', piece: 'sickle', isStalin: false }
      ])

      const [tankPlayer, targetPlayer] = useGameStore.getState().players

      // Mark ability as used
      updatePlayer(tankPlayer.id, { tankRequisitionUsedThisLap: true })

      const initialTargetRubles = useGameStore.getState().players[1].rubles
      const initialTankRubles = useGameStore.getState().players[0].rubles

      tankRequisition(tankPlayer.id, targetPlayer.id)

      const updatedTarget = useGameStore.getState().players.find(p => p.id === targetPlayer.id)
      const updatedTank = useGameStore.getState().players.find(p => p.id === tankPlayer.id)

      expect(updatedTarget?.rubles).toBe(initialTargetRubles) // No change
      expect(updatedTank?.rubles).toBe(initialTankRubles) // No change
    })

    it('should not requisition if player is not a tank piece', () => {
      const { initializePlayers, tankRequisition } = useGameStore.getState()

      initializePlayers([
        { name: 'Sickle Player', piece: 'sickle', isStalin: false },
        { name: 'Target Player', piece: 'hammer', isStalin: false }
      ])

      const [player1, player2] = useGameStore.getState().players

      const initialPlayer2Rubles = player2.rubles
      const initialPlayer1Rubles = player1.rubles

      tankRequisition(player1.id, player2.id)

      const updatedPlayer1 = useGameStore.getState().players.find(p => p.id === player1.id)
      const updatedPlayer2 = useGameStore.getState().players.find(p => p.id === player2.id)

      expect(updatedPlayer1?.rubles).toBe(initialPlayer1Rubles) // No change
      expect(updatedPlayer2?.rubles).toBe(initialPlayer2Rubles) // No change
    })

    it('should handle non-existent tank player gracefully', () => {
      const { initializePlayers, tankRequisition } = useGameStore.getState()

      initializePlayers([
        { name: 'Target Player', piece: 'sickle', isStalin: false }
      ])

      const [targetPlayer] = useGameStore.getState().players
      const initialRubles = targetPlayer.rubles

      tankRequisition('non-existent-id', targetPlayer.id)

      const updatedTarget = useGameStore.getState().players.find(p => p.id === targetPlayer.id)
      expect(updatedTarget?.rubles).toBe(initialRubles) // No change
    })

    it('should handle non-existent target player gracefully', () => {
      const { initializePlayers, tankRequisition } = useGameStore.getState()

      initializePlayers([
        { name: 'Tank Player', piece: 'tank', isStalin: false }
      ])

      const [tankPlayer] = useGameStore.getState().players
      const initialRubles = tankPlayer.rubles

      tankRequisition(tankPlayer.id, 'non-existent-id')

      const updatedTank = useGameStore.getState().players.find(p => p.id === tankPlayer.id)
      expect(updatedTank?.rubles).toBe(initialRubles) // No change
    })

    it('should requisition 0 rubles if target has no money', () => {
      const { initializePlayers, updatePlayer, tankRequisition } = useGameStore.getState()

      initializePlayers([
        { name: 'Tank Player', piece: 'tank', isStalin: false },
        { name: 'Target Player', piece: 'sickle', isStalin: false }
      ])

      const [tankPlayer, targetPlayer] = useGameStore.getState().players

      // Target has no money
      updatePlayer(targetPlayer.id, { rubles: 0 })

      tankRequisition(tankPlayer.id, targetPlayer.id)

      const updatedTarget = useGameStore.getState().players.find(p => p.id === targetPlayer.id)
      const updatedTank = useGameStore.getState().players.find(p => p.id === tankPlayer.id)

      expect(updatedTarget?.rubles).toBe(0)
      expect(updatedTank?.rubles).toBe(1500) // No change (+ 0)
      expect(updatedTank?.tankRequisitionUsedThisLap).toBe(true) // Still marks as used
    })
  })
})

describe('gameStore - Property Transactions', () => {
  beforeEach(() => {
    // Reset store to clean state
    useGameStore.setState({
      gamePhase: 'playing',
      players: [],
      properties: [],
      gameLog: [],
      stateTreasury: 1000,
      turnPhase: 'pre-roll',
      pendingAction: null
    })
  })

  describe('purchaseProperty', () => {
    it('should allow player to purchase unowned property', () => {
      const { initializePlayers, initializeProperties, purchaseProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])
      initializeProperties()

      const [player1] = useGameStore.getState().players
      const initialRubles = player1.rubles

      purchaseProperty(player1.id, 3, 60) // Space 3 = Gulag Mines, baseCost 60

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.rubles).toBe(initialRubles - 60)
    })

    it('should set property custodianId to player', () => {
      const { initializePlayers, initializeProperties, purchaseProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])
      initializeProperties()

      const [player1] = useGameStore.getState().players

      purchaseProperty(player1.id, 3, 60)

      const property = useGameStore.getState().properties.find(p => p.spaceId === 3)
      expect(property?.custodianId).toBe(player1.id)
    })

    it('should add property to player properties array', () => {
      const { initializePlayers, initializeProperties, purchaseProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])
      initializeProperties()

      const [player1] = useGameStore.getState().players

      expect(player1.properties).toEqual([])

      purchaseProperty(player1.id, 3, 60)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.properties).toContain('3')
    })

    it('should add purchase amount to state treasury', () => {
      const { initializePlayers, initializeProperties, purchaseProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])
      initializeProperties()

      const [player1] = useGameStore.getState().players
      const initialTreasury = useGameStore.getState().stateTreasury

      purchaseProperty(player1.id, 3, 60)

      const state = useGameStore.getState()
      expect(state.stateTreasury).toBe(initialTreasury + 60)
    })

    it('should add log entry for property purchase', () => {
      const { initializePlayers, initializeProperties, purchaseProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])
      initializeProperties()

      const [player1] = useGameStore.getState().players

      // Clear log
      useGameStore.setState({ gameLog: [] })

      purchaseProperty(player1.id, 3, 60)

      const state = useGameStore.getState()
      const purchaseLog = state.gameLog.find(log =>
        log.type === 'property' && log.message.includes('became Custodian')
      )

      expect(purchaseLog).toBeDefined()
      expect(purchaseLog?.playerId).toBe(player1.id)
    })

    it('should not allow purchase if player has insufficient rubles', () => {
      const { initializePlayers, initializeProperties, updatePlayer, purchaseProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])
      initializeProperties()

      const [player1] = useGameStore.getState().players

      // Set player rubles to 50, less than property cost
      updatePlayer(player1.id, { rubles: 50 })

      purchaseProperty(player1.id, 3, 60) // Cost is 60

      const property = useGameStore.getState().properties.find(p => p.spaceId === 3)
      expect(property?.custodianId).toBeNull() // Property not purchased

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.rubles).toBe(50) // Rubles unchanged
    })

    it('should block Tank piece from purchasing Collective Farm properties', () => {
      const { initializePlayers, initializeProperties, purchaseProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Tank Player', piece: 'tank', isStalin: false }
      ])
      initializeProperties()

      const [player1] = useGameStore.getState().players
      const initialRubles = player1.rubles

      // Space 6 is a Collective Farm property
      purchaseProperty(player1.id, 6, 100)

      const property = useGameStore.getState().properties.find(p => p.spaceId === 6)
      expect(property?.custodianId).toBeNull() // Not purchased

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.rubles).toBe(initialRubles) // Rubles unchanged
    })

    it('should add log entry when Tank is blocked from Collective Farm', () => {
      const { initializePlayers, initializeProperties, purchaseProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Tank Player', piece: 'tank', isStalin: false }
      ])
      initializeProperties()

      const [player1] = useGameStore.getState().players

      // Clear log
      useGameStore.setState({ gameLog: [] })

      // Space 8 is a Collective Farm property
      purchaseProperty(player1.id, 8, 120)

      const state = useGameStore.getState()
      const blockLog = state.gameLog.find(log =>
        log.type === 'system' && log.message.includes('Tank cannot control Collective Farm')
      )

      expect(blockLog).toBeDefined()
      expect(blockLog?.playerId).toBe(player1.id)
    })

    it('should set turnPhase and pendingAction when Tank is blocked', () => {
      const { initializePlayers, initializeProperties, purchaseProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Tank Player', piece: 'tank', isStalin: false }
      ])
      initializeProperties()

      const [player1] = useGameStore.getState().players

      useGameStore.setState({ turnPhase: 'resolving', pendingAction: { type: 'property-purchase', data: {} } })

      purchaseProperty(player1.id, 9, 140) // Space 9 is Collective Farm

      const state = useGameStore.getState()
      expect(state.turnPhase).toBe('post-turn')
      expect(state.pendingAction).toBeNull()
    })

    it('should allow Tank to purchase non-Collective Farm properties', () => {
      const { initializePlayers, initializeProperties, purchaseProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Tank Player', piece: 'tank', isStalin: false }
      ])
      initializeProperties()

      const [player1] = useGameStore.getState().players

      // Space 3 is not a Collective Farm
      purchaseProperty(player1.id, 3, 60)

      const property = useGameStore.getState().properties.find(p => p.spaceId === 3)
      expect(property?.custodianId).toBe(player1.id) // Successfully purchased
    })

    it('should handle non-existent player gracefully', () => {
      const { initializePlayers, initializeProperties, purchaseProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])
      initializeProperties()

      const initialState = useGameStore.getState()

      purchaseProperty('non-existent-id', 3, 60)

      const property = useGameStore.getState().properties.find(p => p.spaceId === 3)
      expect(property?.custodianId).toBeNull()
      expect(useGameStore.getState().stateTreasury).toBe(initialState.stateTreasury)
    })
  })

  describe('payQuota', () => {
    it('should transfer rubles from payer to custodian', () => {
      const { initializePlayers, payQuota } = useGameStore.getState()

      initializePlayers([
        { name: 'Payer', piece: 'sickle', isStalin: false },
        { name: 'Custodian', piece: 'hammer', isStalin: false }
      ])

      const [payer, custodian] = useGameStore.getState().players
      const payerInitialRubles = payer.rubles
      const custodianInitialRubles = custodian.rubles

      payQuota(payer.id, custodian.id, 100)

      const updatedPayer = useGameStore.getState().players.find(p => p.id === payer.id)
      const updatedCustodian = useGameStore.getState().players.find(p => p.id === custodian.id)

      expect(updatedPayer?.rubles).toBe(payerInitialRubles - 100)
      expect(updatedCustodian?.rubles).toBe(custodianInitialRubles + 100)
    })

    it('should add log entry for quota payment', () => {
      const { initializePlayers, payQuota } = useGameStore.getState()

      initializePlayers([
        { name: 'Payer', piece: 'sickle', isStalin: false },
        { name: 'Custodian', piece: 'hammer', isStalin: false }
      ])

      const [payer, custodian] = useGameStore.getState().players

      // Clear log
      useGameStore.setState({ gameLog: [] })

      payQuota(payer.id, custodian.id, 100)

      const state = useGameStore.getState()
      const quotaLog = state.gameLog.find(log =>
        log.type === 'payment' && log.message.includes('paid ₽100 quota to')
      )

      expect(quotaLog).toBeDefined()
      expect(quotaLog?.playerId).toBe(payer.id)
    })

    it('should handle non-existent payer gracefully', () => {
      const { initializePlayers, payQuota } = useGameStore.getState()

      initializePlayers([
        { name: 'Custodian', piece: 'hammer', isStalin: false }
      ])

      const [custodian] = useGameStore.getState().players
      const initialRubles = custodian.rubles

      payQuota('non-existent-id', custodian.id, 100)

      const updatedCustodian = useGameStore.getState().players.find(p => p.id === custodian.id)
      expect(updatedCustodian?.rubles).toBe(initialRubles) // No change
    })

    it('should handle non-existent custodian gracefully', () => {
      const { initializePlayers, payQuota } = useGameStore.getState()

      initializePlayers([
        { name: 'Payer', piece: 'sickle', isStalin: false }
      ])

      const [payer] = useGameStore.getState().players
      const initialRubles = payer.rubles

      payQuota(payer.id, 'non-existent-id', 100)

      const updatedPayer = useGameStore.getState().players.find(p => p.id === payer.id)
      expect(updatedPayer?.rubles).toBe(initialRubles) // No change
    })
  })

  describe('mortgageProperty', () => {
    it('should give player 50% of property base cost', () => {
      const { initializePlayers, initializeProperties, setPropertyCustodian, mortgageProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])
      initializeProperties()

      const [player1] = useGameStore.getState().players

      // Set player as custodian of space 3 (base cost 60)
      setPropertyCustodian(3, player1.id)

      const initialRubles = useGameStore.getState().players[0].rubles

      mortgageProperty(3)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.rubles).toBe(initialRubles + 30) // 50% of 60 = 30
    })

    it('should mark property as mortgaged', () => {
      const { initializePlayers, initializeProperties, setPropertyCustodian, mortgageProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])
      initializeProperties()

      const [player1] = useGameStore.getState().players

      setPropertyCustodian(3, player1.id)

      mortgageProperty(3)

      const property = useGameStore.getState().properties.find(p => p.spaceId === 3)
      expect(property?.mortgaged).toBe(true)
    })

    it('should add log entry for mortgage', () => {
      const { initializePlayers, initializeProperties, setPropertyCustodian, mortgageProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])
      initializeProperties()

      const [player1] = useGameStore.getState().players

      setPropertyCustodian(3, player1.id)

      // Clear log
      useGameStore.setState({ gameLog: [] })

      mortgageProperty(3)

      const state = useGameStore.getState()
      const mortgageLog = state.gameLog.find(log =>
        log.type === 'property' && log.message.includes('mortgaged')
      )

      expect(mortgageLog).toBeDefined()
      expect(mortgageLog?.playerId).toBe(player1.id)
    })

    it('should not mortgage property with no custodian', () => {
      const { initializePlayers, initializeProperties, mortgageProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])
      initializeProperties()

      // Property 3 has no custodian
      mortgageProperty(3)

      const property = useGameStore.getState().properties.find(p => p.spaceId === 3)
      expect(property?.mortgaged).toBe(false) // Not mortgaged
    })

    it('should calculate mortgage value correctly for different properties', () => {
      const { initializePlayers, initializeProperties, setPropertyCustodian, mortgageProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])
      initializeProperties()

      const [player1] = useGameStore.getState().players

      // Set player as custodian of space 6 (base cost 100)
      setPropertyCustodian(6, player1.id)

      const initialRubles = useGameStore.getState().players[0].rubles

      mortgageProperty(6)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.rubles).toBe(initialRubles + 50) // 50% of 100 = 50
    })
  })

  describe('unmortgageProperty', () => {
    it('should deduct 60% of property base cost from player', () => {
      const { initializePlayers, initializeProperties, setPropertyCustodian, unmortgageProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])
      initializeProperties()

      const [player1] = useGameStore.getState().players

      // Set player as custodian and mark property as mortgaged
      setPropertyCustodian(3, player1.id)
      useGameStore.setState({
        properties: useGameStore.getState().properties.map(p =>
          p.spaceId === 3 ? { ...p, mortgaged: true } : p
        )
      })

      const initialRubles = useGameStore.getState().players[0].rubles

      unmortgageProperty(3, player1.id)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.rubles).toBe(initialRubles - 36) // 60% of 60 = 36
    })

    it('should mark property as unmortgaged', () => {
      const { initializePlayers, initializeProperties, setPropertyCustodian, unmortgageProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])
      initializeProperties()

      const [player1] = useGameStore.getState().players

      setPropertyCustodian(3, player1.id)
      useGameStore.setState({
        properties: useGameStore.getState().properties.map(p =>
          p.spaceId === 3 ? { ...p, mortgaged: true } : p
        )
      })

      unmortgageProperty(3, player1.id)

      const property = useGameStore.getState().properties.find(p => p.spaceId === 3)
      expect(property?.mortgaged).toBe(false)
    })

    it('should add log entry for unmortgage', () => {
      const { initializePlayers, initializeProperties, setPropertyCustodian, unmortgageProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])
      initializeProperties()

      const [player1] = useGameStore.getState().players

      setPropertyCustodian(3, player1.id)
      useGameStore.setState({
        properties: useGameStore.getState().properties.map(p =>
          p.spaceId === 3 ? { ...p, mortgaged: true } : p
        )
      })

      // Clear log
      useGameStore.setState({ gameLog: [] })

      unmortgageProperty(3, player1.id)

      const state = useGameStore.getState()
      const unmortgageLog = state.gameLog.find(log =>
        log.type === 'property' && log.message.includes('unmortgaged')
      )

      expect(unmortgageLog).toBeDefined()
      expect(unmortgageLog?.playerId).toBe(player1.id)
    })

    it('should not unmortgage if player has insufficient rubles', () => {
      const { initializePlayers, initializeProperties, setPropertyCustodian, updatePlayer, unmortgageProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])
      initializeProperties()

      const [player1] = useGameStore.getState().players

      setPropertyCustodian(3, player1.id)
      useGameStore.setState({
        properties: useGameStore.getState().properties.map(p =>
          p.spaceId === 3 ? { ...p, mortgaged: true } : p
        )
      })

      // Set player rubles to 30, less than unmortgage cost of 36
      updatePlayer(player1.id, { rubles: 30 })

      unmortgageProperty(3, player1.id)

      const property = useGameStore.getState().properties.find(p => p.spaceId === 3)
      expect(property?.mortgaged).toBe(true) // Still mortgaged

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.rubles).toBe(30) // Rubles unchanged
    })

    it('should handle non-existent property gracefully', () => {
      const { initializePlayers, initializeProperties, unmortgageProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])
      initializeProperties()

      const [player1] = useGameStore.getState().players
      const initialRubles = player1.rubles

      unmortgageProperty(999, player1.id) // Non-existent property

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.rubles).toBe(initialRubles) // No change
    })

    it('should handle non-existent player gracefully', () => {
      const { initializePlayers, initializeProperties, setPropertyCustodian, unmortgageProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])
      initializeProperties()

      const [player1] = useGameStore.getState().players

      setPropertyCustodian(3, player1.id)
      useGameStore.setState({
        properties: useGameStore.getState().properties.map(p =>
          p.spaceId === 3 ? { ...p, mortgaged: true } : p
        )
      })

      unmortgageProperty(3, 'non-existent-id')

      const property = useGameStore.getState().properties.find(p => p.spaceId === 3)
      expect(property?.mortgaged).toBe(true) // Still mortgaged
    })
  })

  describe('transferProperty', () => {
    it('should update property custodianId to new owner', () => {
      const { initializePlayers, initializeProperties, setPropertyCustodian, transferProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])
      initializeProperties()

      const [player1, player2] = useGameStore.getState().players

      setPropertyCustodian(3, player1.id)

      transferProperty('3', player2.id)

      const property = useGameStore.getState().properties.find(p => p.spaceId === 3)
      expect(property?.custodianId).toBe(player2.id)
    })

    it('should remove property from old owner properties array', () => {
      const { initializePlayers, initializeProperties, setPropertyCustodian, updatePlayer, transferProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])
      initializeProperties()

      const [player1, player2] = useGameStore.getState().players

      setPropertyCustodian(3, player1.id)
      updatePlayer(player1.id, { properties: ['3'] })

      transferProperty('3', player2.id)

      const updatedPlayer1 = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer1?.properties).not.toContain('3')
    })

    it('should add property to new owner properties array', () => {
      const { initializePlayers, initializeProperties, setPropertyCustodian, updatePlayer, transferProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])
      initializeProperties()

      const [player1, player2] = useGameStore.getState().players

      setPropertyCustodian(3, player1.id)
      updatePlayer(player1.id, { properties: ['3'] })
      expect(player2.properties).toEqual([])

      transferProperty('3', player2.id)

      const updatedPlayer2 = useGameStore.getState().players.find(p => p.id === player2.id)
      expect(updatedPlayer2?.properties).toContain('3')
    })

    it('should handle transfer from unowned property', () => {
      const { initializePlayers, initializeProperties, transferProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])
      initializeProperties()

      const [player1] = useGameStore.getState().players

      // Property 3 has no custodian
      transferProperty('3', player1.id)

      const property = useGameStore.getState().properties.find(p => p.spaceId === 3)
      expect(property?.custodianId).toBe(player1.id)

      const updatedPlayer1 = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer1?.properties).toContain('3')
    })

    it('should handle non-existent property gracefully', () => {
      const { initializePlayers, initializeProperties, transferProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])
      initializeProperties()

      const [player1] = useGameStore.getState().players

      const initialState = useGameStore.getState()

      transferProperty('999', player1.id) // Non-existent property

      // State should remain unchanged
      const finalState = useGameStore.getState()
      expect(finalState.properties).toEqual(initialState.properties)
    })

    it('should handle transfer between same properties of same owner', () => {
      const { initializePlayers, initializeProperties, setPropertyCustodian, updatePlayer, transferProperty } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])
      initializeProperties()

      const [player1] = useGameStore.getState().players

      setPropertyCustodian(3, player1.id)
      updatePlayer(player1.id, { properties: ['3'] })

      // Transfer to same player
      transferProperty('3', player1.id)

      const property = useGameStore.getState().properties.find(p => p.spaceId === 3)
      expect(property?.custodianId).toBe(player1.id)

      const updatedPlayer1 = useGameStore.getState().players.find(p => p.id === player1.id)
      // Property should be in array (added again since it was removed first)
      expect(updatedPlayer1?.properties).toContain('3')
    })
  })
})

describe('gameStore - Voucher & Bribe System', () => {
  beforeEach(() => {
    // Reset store to clean state
    useGameStore.setState({
      gamePhase: 'playing',
      players: [],
      properties: [],
      gameLog: [],
      stateTreasury: 1000,
      turnPhase: 'pre-roll',
      pendingAction: null,
      activeVouchers: [],
      pendingBribes: [],
      roundNumber: 1
    })
  })

  describe('createVoucher', () => {
    it('should create voucher for prisoner', () => {
      const { initializePlayers, createVoucher } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner', piece: 'sickle', isStalin: false },
        { name: 'Voucher', piece: 'hammer', isStalin: false }
      ])

      const [prisoner, voucherPlayer] = useGameStore.getState().players

      // Put prisoner in Gulag
      useGameStore.getState().updatePlayer(prisoner.id, { inGulag: true, gulagTurns: 2 })

      createVoucher(prisoner.id, voucherPlayer.id)

      const state = useGameStore.getState()
      expect(state.activeVouchers).toHaveLength(1)
      expect(state.activeVouchers[0].prisonerId).toBe(prisoner.id)
      expect(state.activeVouchers[0].voucherId).toBe(voucherPlayer.id)
    })

    it('should release prisoner immediately from Gulag', () => {
      const { initializePlayers, createVoucher } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner', piece: 'sickle', isStalin: false },
        { name: 'Voucher', piece: 'hammer', isStalin: false }
      ])

      const [prisoner, voucherPlayer] = useGameStore.getState().players

      // Put prisoner in Gulag
      useGameStore.getState().updatePlayer(prisoner.id, { inGulag: true, gulagTurns: 2 })

      createVoucher(prisoner.id, voucherPlayer.id)

      const updatedPrisoner = useGameStore.getState().players.find(p => p.id === prisoner.id)
      expect(updatedPrisoner?.inGulag).toBe(false)
      expect(updatedPrisoner?.gulagTurns).toBe(0)
    })

    it('should set voucher expiration to current round + 3', () => {
      const { initializePlayers, createVoucher } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner', piece: 'sickle', isStalin: false },
        { name: 'Voucher', piece: 'hammer', isStalin: false }
      ])

      const [prisoner, voucherPlayer] = useGameStore.getState().players

      useGameStore.getState().updatePlayer(prisoner.id, { inGulag: true, gulagTurns: 2 })
      useGameStore.setState({ roundNumber: 5 })

      createVoucher(prisoner.id, voucherPlayer.id)

      const state = useGameStore.getState()
      expect(state.activeVouchers[0].expiresAtRound).toBe(8) // 5 + 3
    })

    it('should update voucher player vouchingFor property', () => {
      const { initializePlayers, createVoucher } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner', piece: 'sickle', isStalin: false },
        { name: 'Voucher', piece: 'hammer', isStalin: false }
      ])

      const [prisoner, voucherPlayer] = useGameStore.getState().players

      useGameStore.getState().updatePlayer(prisoner.id, { inGulag: true, gulagTurns: 2 })

      createVoucher(prisoner.id, voucherPlayer.id)

      const updatedVoucher = useGameStore.getState().players.find(p => p.id === voucherPlayer.id)
      expect(updatedVoucher?.vouchingFor).toBe(prisoner.id)
      expect(updatedVoucher?.vouchedByRound).toBe(4) // 1 + 3
    })

    it('should set voucher isActive to true', () => {
      const { initializePlayers, createVoucher } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner', piece: 'sickle', isStalin: false },
        { name: 'Voucher', piece: 'hammer', isStalin: false }
      ])

      const [prisoner, voucherPlayer] = useGameStore.getState().players

      useGameStore.getState().updatePlayer(prisoner.id, { inGulag: true, gulagTurns: 2 })

      createVoucher(prisoner.id, voucherPlayer.id)

      const state = useGameStore.getState()
      expect(state.activeVouchers[0].isActive).toBe(true)
    })

    it('should add log entry for voucher creation', () => {
      const { initializePlayers, createVoucher } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner', piece: 'sickle', isStalin: false },
        { name: 'Voucher', piece: 'hammer', isStalin: false }
      ])

      const [prisoner, voucherPlayer] = useGameStore.getState().players

      useGameStore.getState().updatePlayer(prisoner.id, { inGulag: true, gulagTurns: 2 })
      useGameStore.setState({ gameLog: [] })

      createVoucher(prisoner.id, voucherPlayer.id)

      const state = useGameStore.getState()
      const voucherLog = state.gameLog.find(log =>
        log.type === 'gulag' && log.message.includes('vouched for')
      )

      expect(voucherLog).toBeDefined()
      expect(voucherLog?.message).toContain('Voucher')
      expect(voucherLog?.message).toContain('Prisoner')
    })

    it('should set turnPhase to post-turn', () => {
      const { initializePlayers, createVoucher } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner', piece: 'sickle', isStalin: false },
        { name: 'Voucher', piece: 'hammer', isStalin: false }
      ])

      const [prisoner, voucherPlayer] = useGameStore.getState().players

      useGameStore.getState().updatePlayer(prisoner.id, { inGulag: true, gulagTurns: 2 })
      useGameStore.setState({ turnPhase: 'resolving' })

      createVoucher(prisoner.id, voucherPlayer.id)

      const state = useGameStore.getState()
      expect(state.turnPhase).toBe('post-turn')
    })

    it('should set pendingAction to null', () => {
      const { initializePlayers, createVoucher } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner', piece: 'sickle', isStalin: false },
        { name: 'Voucher', piece: 'hammer', isStalin: false }
      ])

      const [prisoner, voucherPlayer] = useGameStore.getState().players

      useGameStore.getState().updatePlayer(prisoner.id, { inGulag: true, gulagTurns: 2 })
      useGameStore.setState({ pendingAction: { type: 'voucher', data: {} } })

      createVoucher(prisoner.id, voucherPlayer.id)

      const state = useGameStore.getState()
      expect(state.pendingAction).toBeNull()
    })

    it('should handle non-existent prisoner gracefully', () => {
      const { initializePlayers, createVoucher } = useGameStore.getState()

      initializePlayers([
        { name: 'Voucher', piece: 'hammer', isStalin: false }
      ])

      const [voucherPlayer] = useGameStore.getState().players

      createVoucher('non-existent-id', voucherPlayer.id)

      const state = useGameStore.getState()
      expect(state.activeVouchers).toHaveLength(0) // No voucher created
    })

    it('should handle non-existent voucher player gracefully', () => {
      const { initializePlayers, createVoucher } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner', piece: 'sickle', isStalin: false }
      ])

      const [prisoner] = useGameStore.getState().players

      useGameStore.getState().updatePlayer(prisoner.id, { inGulag: true, gulagTurns: 2 })

      createVoucher(prisoner.id, 'non-existent-id')

      const state = useGameStore.getState()
      expect(state.activeVouchers).toHaveLength(0) // No voucher created
    })
  })

  describe('checkVoucherConsequences', () => {
    it('should send voucher player to Gulag when prisoner commits triggering offense', () => {
      const { initializePlayers, createVoucher, checkVoucherConsequences } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner', piece: 'sickle', isStalin: false },
        { name: 'Voucher', piece: 'hammer', isStalin: false }
      ])

      const [prisoner, voucherPlayer] = useGameStore.getState().players

      // Create voucher
      useGameStore.getState().updatePlayer(prisoner.id, { inGulag: true, gulagTurns: 2 })
      createVoucher(prisoner.id, voucherPlayer.id)

      // Prisoner commits offense
      checkVoucherConsequences(prisoner.id, 'enemyOfState')

      const updatedVoucher = useGameStore.getState().players.find(p => p.id === voucherPlayer.id)
      expect(updatedVoucher?.inGulag).toBe(true)
    })

    it('should deactivate voucher after consequence triggered', () => {
      const { initializePlayers, createVoucher, checkVoucherConsequences } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner', piece: 'sickle', isStalin: false },
        { name: 'Voucher', piece: 'hammer', isStalin: false }
      ])

      const [prisoner, voucherPlayer] = useGameStore.getState().players

      useGameStore.getState().updatePlayer(prisoner.id, { inGulag: true, gulagTurns: 2 })
      createVoucher(prisoner.id, voucherPlayer.id)

      checkVoucherConsequences(prisoner.id, 'threeDoubles')

      const state = useGameStore.getState()
      expect(state.activeVouchers[0].isActive).toBe(false)
    })

    it('should add log entry for voucher consequence', () => {
      const { initializePlayers, createVoucher, checkVoucherConsequences } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner', piece: 'sickle', isStalin: false },
        { name: 'Voucher', piece: 'hammer', isStalin: false }
      ])

      const [prisoner, voucherPlayer] = useGameStore.getState().players

      useGameStore.getState().updatePlayer(prisoner.id, { inGulag: true, gulagTurns: 2 })
      createVoucher(prisoner.id, voucherPlayer.id)

      // Clear log after voucher creation
      useGameStore.setState({ gameLog: [] })

      checkVoucherConsequences(prisoner.id, 'denouncementGuilty')

      const state = useGameStore.getState()
      const consequenceLog = state.gameLog.find(log =>
        log.type === 'gulag' && log.message.includes('sent to Gulag due to')
      )

      expect(consequenceLog).toBeDefined()
      expect(consequenceLog?.message).toContain('Voucher')
      expect(consequenceLog?.message).toContain('Prisoner')
    })

    it('should not trigger consequence for non-triggering reasons', () => {
      const { initializePlayers, createVoucher, checkVoucherConsequences } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner', piece: 'sickle', isStalin: false },
        { name: 'Voucher', piece: 'hammer', isStalin: false }
      ])

      const [prisoner, voucherPlayer] = useGameStore.getState().players

      useGameStore.getState().updatePlayer(prisoner.id, { inGulag: true, gulagTurns: 2 })
      createVoucher(prisoner.id, voucherPlayer.id)

      // Use a non-triggering reason (voucherConsequence itself shouldn't re-trigger)
      checkVoucherConsequences(prisoner.id, 'voucherConsequence')

      const updatedVoucher = useGameStore.getState().players.find(p => p.id === voucherPlayer.id)
      expect(updatedVoucher?.inGulag).toBe(false) // Should not be sent to Gulag

      const state = useGameStore.getState()
      expect(state.activeVouchers[0].isActive).toBe(true) // Voucher still active
    })

    it('should not trigger if voucher has expired', () => {
      const { initializePlayers, createVoucher, checkVoucherConsequences } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner', piece: 'sickle', isStalin: false },
        { name: 'Voucher', piece: 'hammer', isStalin: false }
      ])

      const [prisoner, voucherPlayer] = useGameStore.getState().players

      useGameStore.getState().updatePlayer(prisoner.id, { inGulag: true, gulagTurns: 2 })
      useGameStore.setState({ roundNumber: 1 })
      createVoucher(prisoner.id, voucherPlayer.id)

      // Move to round past expiration (voucher expires at round 4)
      useGameStore.setState({ roundNumber: 5 })

      checkVoucherConsequences(prisoner.id, 'enemyOfState')

      const updatedVoucher = useGameStore.getState().players.find(p => p.id === voucherPlayer.id)
      expect(updatedVoucher?.inGulag).toBe(false) // Should not be sent to Gulag
    })

    it('should not trigger if voucher is already inactive', () => {
      const { initializePlayers, createVoucher, checkVoucherConsequences } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner', piece: 'sickle', isStalin: false },
        { name: 'Voucher', piece: 'hammer', isStalin: false }
      ])

      const [prisoner, voucherPlayer] = useGameStore.getState().players

      useGameStore.getState().updatePlayer(prisoner.id, { inGulag: true, gulagTurns: 2 })
      createVoucher(prisoner.id, voucherPlayer.id)

      // Deactivate the voucher manually
      useGameStore.setState({
        activeVouchers: useGameStore.getState().activeVouchers.map(v => ({ ...v, isActive: false }))
      })

      checkVoucherConsequences(prisoner.id, 'enemyOfState')

      const updatedVoucher = useGameStore.getState().players.find(p => p.id === voucherPlayer.id)
      expect(updatedVoucher?.inGulag).toBe(false) // Should not be sent to Gulag
    })

    it('should handle pilferingCaught as triggering reason', () => {
      const { initializePlayers, createVoucher, checkVoucherConsequences } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner', piece: 'sickle', isStalin: false },
        { name: 'Voucher', piece: 'hammer', isStalin: false }
      ])

      const [prisoner, voucherPlayer] = useGameStore.getState().players

      useGameStore.getState().updatePlayer(prisoner.id, { inGulag: true, gulagTurns: 2 })
      createVoucher(prisoner.id, voucherPlayer.id)

      checkVoucherConsequences(prisoner.id, 'pilferingCaught')

      const updatedVoucher = useGameStore.getState().players.find(p => p.id === voucherPlayer.id)
      expect(updatedVoucher?.inGulag).toBe(true)
    })

    it('should handle stalinDecree as triggering reason', () => {
      const { initializePlayers, createVoucher, checkVoucherConsequences } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner', piece: 'sickle', isStalin: false },
        { name: 'Voucher', piece: 'hammer', isStalin: false }
      ])

      const [prisoner, voucherPlayer] = useGameStore.getState().players

      useGameStore.getState().updatePlayer(prisoner.id, { inGulag: true, gulagTurns: 2 })
      createVoucher(prisoner.id, voucherPlayer.id)

      checkVoucherConsequences(prisoner.id, 'stalinDecree')

      const updatedVoucher = useGameStore.getState().players.find(p => p.id === voucherPlayer.id)
      expect(updatedVoucher?.inGulag).toBe(true)
    })

    it('should handle railwayCapture as triggering reason', () => {
      const { initializePlayers, createVoucher, checkVoucherConsequences } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner', piece: 'sickle', isStalin: false },
        { name: 'Voucher', piece: 'hammer', isStalin: false }
      ])

      const [prisoner, voucherPlayer] = useGameStore.getState().players

      useGameStore.getState().updatePlayer(prisoner.id, { inGulag: true, gulagTurns: 2 })
      createVoucher(prisoner.id, voucherPlayer.id)

      checkVoucherConsequences(prisoner.id, 'railwayCapture')

      const updatedVoucher = useGameStore.getState().players.find(p => p.id === voucherPlayer.id)
      expect(updatedVoucher?.inGulag).toBe(true)
    })

    it('should handle campLabour as triggering reason', () => {
      const { initializePlayers, createVoucher, checkVoucherConsequences } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner', piece: 'sickle', isStalin: false },
        { name: 'Voucher', piece: 'hammer', isStalin: false }
      ])

      const [prisoner, voucherPlayer] = useGameStore.getState().players

      useGameStore.getState().updatePlayer(prisoner.id, { inGulag: true, gulagTurns: 2 })
      createVoucher(prisoner.id, voucherPlayer.id)

      checkVoucherConsequences(prisoner.id, 'campLabour')

      const updatedVoucher = useGameStore.getState().players.find(p => p.id === voucherPlayer.id)
      expect(updatedVoucher?.inGulag).toBe(true)
    })
  })

  describe('expireVouchers', () => {
    it('should expire vouchers after expiration round', () => {
      const { initializePlayers, createVoucher, expireVouchers } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner', piece: 'sickle', isStalin: false },
        { name: 'Voucher', piece: 'hammer', isStalin: false }
      ])

      const [prisoner, voucherPlayer] = useGameStore.getState().players

      useGameStore.getState().updatePlayer(prisoner.id, { inGulag: true, gulagTurns: 2 })
      useGameStore.setState({ roundNumber: 1 })
      createVoucher(prisoner.id, voucherPlayer.id)

      // Voucher expires at round 4, move to round 5
      useGameStore.setState({ roundNumber: 5 })

      expireVouchers()

      const state = useGameStore.getState()
      expect(state.activeVouchers[0].isActive).toBe(false)
    })

    it('should clear vouchingFor from voucher player', () => {
      const { initializePlayers, createVoucher, expireVouchers } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner', piece: 'sickle', isStalin: false },
        { name: 'Voucher', piece: 'hammer', isStalin: false }
      ])

      const [prisoner, voucherPlayer] = useGameStore.getState().players

      useGameStore.getState().updatePlayer(prisoner.id, { inGulag: true, gulagTurns: 2 })
      useGameStore.setState({ roundNumber: 1 })
      createVoucher(prisoner.id, voucherPlayer.id)

      // Verify voucher player is vouchingFor prisoner
      const beforeExpire = useGameStore.getState().players.find(p => p.id === voucherPlayer.id)
      expect(beforeExpire?.vouchingFor).toBe(prisoner.id)

      useGameStore.setState({ roundNumber: 5 })
      expireVouchers()

      const updatedVoucher = useGameStore.getState().players.find(p => p.id === voucherPlayer.id)
      expect(updatedVoucher?.vouchingFor).toBeNull()
      expect(updatedVoucher?.vouchedByRound).toBeNull()
    })

    it('should not expire vouchers still within expiration period', () => {
      const { initializePlayers, createVoucher, expireVouchers } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner', piece: 'sickle', isStalin: false },
        { name: 'Voucher', piece: 'hammer', isStalin: false }
      ])

      const [prisoner, voucherPlayer] = useGameStore.getState().players

      useGameStore.getState().updatePlayer(prisoner.id, { inGulag: true, gulagTurns: 2 })
      useGameStore.setState({ roundNumber: 1 })
      createVoucher(prisoner.id, voucherPlayer.id)

      // Voucher expires at round 4, currently at round 3
      useGameStore.setState({ roundNumber: 3 })

      expireVouchers()

      const state = useGameStore.getState()
      expect(state.activeVouchers[0].isActive).toBe(true) // Still active
    })

    it('should expire vouchers exactly at expiration round', () => {
      const { initializePlayers, createVoucher, expireVouchers } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner', piece: 'sickle', isStalin: false },
        { name: 'Voucher', piece: 'hammer', isStalin: false }
      ])

      const [prisoner, voucherPlayer] = useGameStore.getState().players

      useGameStore.getState().updatePlayer(prisoner.id, { inGulag: true, gulagTurns: 2 })
      useGameStore.setState({ roundNumber: 1 })
      createVoucher(prisoner.id, voucherPlayer.id)

      // Voucher expires at round 4
      useGameStore.setState({ roundNumber: 4 })

      expireVouchers()

      const state = useGameStore.getState()
      // At exactly expiration round, should NOT expire (roundNumber > expiresAtRound)
      expect(state.activeVouchers[0].isActive).toBe(true)
    })

    it('should handle multiple vouchers with different expiration dates', () => {
      const { initializePlayers, createVoucher, expireVouchers } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner1', piece: 'sickle', isStalin: false },
        { name: 'Voucher1', piece: 'hammer', isStalin: false },
        { name: 'Prisoner2', piece: 'tank', isStalin: false },
        { name: 'Voucher2', piece: 'star', isStalin: false }
      ])

      const [prisoner1, voucher1, prisoner2, voucher2] = useGameStore.getState().players

      useGameStore.getState().updatePlayer(prisoner1.id, { inGulag: true, gulagTurns: 2 })
      useGameStore.getState().updatePlayer(prisoner2.id, { inGulag: true, gulagTurns: 2 })

      // Create first voucher at round 1 (expires at round 4)
      useGameStore.setState({ roundNumber: 1 })
      createVoucher(prisoner1.id, voucher1.id)

      // Create second voucher at round 3 (expires at round 6)
      useGameStore.setState({ roundNumber: 3 })
      createVoucher(prisoner2.id, voucher2.id)

      // Move to round 5 (first expires, second doesn't)
      useGameStore.setState({ roundNumber: 5 })
      expireVouchers()

      const state = useGameStore.getState()
      expect(state.activeVouchers[0].isActive).toBe(false) // First expired
      expect(state.activeVouchers[1].isActive).toBe(true)  // Second still active
    })

    it('should not expire already inactive vouchers', () => {
      const { initializePlayers, createVoucher, expireVouchers } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner', piece: 'sickle', isStalin: false },
        { name: 'Voucher', piece: 'hammer', isStalin: false }
      ])

      const [prisoner, voucherPlayer] = useGameStore.getState().players

      useGameStore.getState().updatePlayer(prisoner.id, { inGulag: true, gulagTurns: 2 })
      useGameStore.setState({ roundNumber: 1 })
      createVoucher(prisoner.id, voucherPlayer.id)

      // Deactivate voucher manually (e.g., from consequence)
      useGameStore.setState({
        activeVouchers: useGameStore.getState().activeVouchers.map(v => ({ ...v, isActive: false }))
      })

      useGameStore.setState({ roundNumber: 5 })
      expireVouchers()

      // Should remain inactive (no change)
      const state = useGameStore.getState()
      expect(state.activeVouchers[0].isActive).toBe(false)
    })
  })

  describe('submitBribe', () => {
    it('should add bribe to pendingBribes', () => {
      const { initializePlayers, submitBribe } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      submitBribe(player1.id, 500, 'gulag-escape')

      const state = useGameStore.getState()
      expect(state.pendingBribes).toHaveLength(1)
      expect(state.pendingBribes[0].playerId).toBe(player1.id)
      expect(state.pendingBribes[0].amount).toBe(500)
      expect(state.pendingBribes[0].reason).toBe('gulag-escape')
    })

    it('should create bribe with correct properties', () => {
      const { initializePlayers, submitBribe } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      submitBribe(player1.id, 300, 'favour')

      const state = useGameStore.getState()
      const bribe = state.pendingBribes[0]

      expect(bribe.id).toMatch(/^bribe-/)
      expect(bribe.playerId).toBe(player1.id)
      expect(bribe.amount).toBe(300)
      expect(bribe.reason).toBe('favour')
      expect(bribe.timestamp).toBeInstanceOf(Date)
    })

    it('should add log entry for bribe submission', () => {
      const { initializePlayers, submitBribe } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      useGameStore.setState({ gameLog: [] })

      submitBribe(player1.id, 400, 'gulag-escape')

      const state = useGameStore.getState()
      const bribeLog = state.gameLog.find(log =>
        log.type === 'system' && log.message.includes('submitted a bribe')
      )

      expect(bribeLog).toBeDefined()
      expect(bribeLog?.message).toContain('₽400')
      expect(bribeLog?.playerId).toBe(player1.id)
    })

    it('should not submit bribe if player has insufficient rubles', () => {
      const { initializePlayers, updatePlayer, submitBribe } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      updatePlayer(player1.id, { rubles: 100 })

      submitBribe(player1.id, 500, 'gulag-escape') // Player only has 100

      const state = useGameStore.getState()
      expect(state.pendingBribes).toHaveLength(0) // No bribe created
    })

    it('should handle non-existent player gracefully', () => {
      const { initializePlayers, submitBribe } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      submitBribe('non-existent-id', 500, 'gulag-escape')

      const state = useGameStore.getState()
      expect(state.pendingBribes).toHaveLength(0) // No bribe created
    })

    it('should allow multiple bribes from same player', () => {
      const { initializePlayers, submitBribe } = useGameStore.getState()

      initializePlayers([
        { name: 'Rich Player', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players
      useGameStore.getState().updatePlayer(player1.id, { rubles: 3000 })

      submitBribe(player1.id, 500, 'gulag-escape')
      submitBribe(player1.id, 300, 'favour')

      const state = useGameStore.getState()
      expect(state.pendingBribes).toHaveLength(2)
    })
  })

  describe('respondToBribe', () => {
    it('should deduct bribe amount from player when accepted', () => {
      const { initializePlayers, submitBribe, respondToBribe } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players
      const initialRubles = player1.rubles

      submitBribe(player1.id, 500, 'gulag-escape')
      const bribeId = useGameStore.getState().pendingBribes[0].id

      respondToBribe(bribeId, true)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.rubles).toBe(initialRubles - 500)
    })

    it('should deduct bribe amount from player when rejected', () => {
      const { initializePlayers, submitBribe, respondToBribe } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players
      const initialRubles = player1.rubles

      submitBribe(player1.id, 500, 'gulag-escape')
      const bribeId = useGameStore.getState().pendingBribes[0].id

      respondToBribe(bribeId, false)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.rubles).toBe(initialRubles - 500) // Money taken anyway
    })

    it('should add bribe amount to treasury', () => {
      const { initializePlayers, submitBribe, respondToBribe } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players
      const initialTreasury = useGameStore.getState().stateTreasury

      submitBribe(player1.id, 500, 'gulag-escape')
      const bribeId = useGameStore.getState().pendingBribes[0].id

      respondToBribe(bribeId, true)

      const state = useGameStore.getState()
      expect(state.stateTreasury).toBe(initialTreasury + 500)
    })

    it('should release player from Gulag when gulag-escape bribe accepted', () => {
      const { initializePlayers, updatePlayer, submitBribe, respondToBribe } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      updatePlayer(player1.id, { inGulag: true, gulagTurns: 2 })

      submitBribe(player1.id, 500, 'gulag-escape')
      const bribeId = useGameStore.getState().pendingBribes[0].id

      respondToBribe(bribeId, true)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.inGulag).toBe(false)
      expect(updatedPlayer?.gulagTurns).toBe(0)
    })

    it('should not release player from Gulag when bribe rejected', () => {
      const { initializePlayers, updatePlayer, submitBribe, respondToBribe } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      updatePlayer(player1.id, { inGulag: true, gulagTurns: 2 })

      submitBribe(player1.id, 500, 'gulag-escape')
      const bribeId = useGameStore.getState().pendingBribes[0].id

      respondToBribe(bribeId, false)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.inGulag).toBe(true) // Still in Gulag
      expect(updatedPlayer?.gulagTurns).toBe(2)
    })

    it('should add log entry when bribe accepted', () => {
      const { initializePlayers, updatePlayer, submitBribe, respondToBribe } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      updatePlayer(player1.id, { inGulag: true, gulagTurns: 2 })
      submitBribe(player1.id, 500, 'gulag-escape')

      useGameStore.setState({ gameLog: [] })

      const bribeId = useGameStore.getState().pendingBribes[0].id

      respondToBribe(bribeId, true)

      const state = useGameStore.getState()
      const acceptLog = state.gameLog.find(log =>
        log.type === 'gulag' && log.message.includes('accepted') && log.message.includes('bribe')
      )

      expect(acceptLog).toBeDefined()
      expect(acceptLog?.message).toContain('₽500')
      expect(acceptLog?.playerId).toBe(player1.id)
    })

    it('should add log entry when bribe rejected', () => {
      const { initializePlayers, submitBribe, respondToBribe } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      submitBribe(player1.id, 500, 'gulag-escape')

      useGameStore.setState({ gameLog: [] })

      const bribeId = useGameStore.getState().pendingBribes[0].id

      respondToBribe(bribeId, false)

      const state = useGameStore.getState()
      const rejectLog = state.gameLog.find(log =>
        log.type === 'payment' && log.message.includes('rejected') && log.message.includes('bribe')
      )

      expect(rejectLog).toBeDefined()
      expect(rejectLog?.message).toContain('₽500')
      expect(rejectLog?.message).toContain('contraband')
      expect(rejectLog?.playerId).toBe(player1.id)
    })

    it('should remove bribe from pendingBribes after response', () => {
      const { initializePlayers, submitBribe, respondToBribe } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      submitBribe(player1.id, 500, 'gulag-escape')
      const bribeId = useGameStore.getState().pendingBribes[0].id

      expect(useGameStore.getState().pendingBribes).toHaveLength(1)

      respondToBribe(bribeId, true)

      const state = useGameStore.getState()
      expect(state.pendingBribes).toHaveLength(0)
    })

    it('should set turnPhase to post-turn when accepted', () => {
      const { initializePlayers, updatePlayer, submitBribe, respondToBribe } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      updatePlayer(player1.id, { inGulag: true, gulagTurns: 2 })
      submitBribe(player1.id, 500, 'gulag-escape')

      useGameStore.setState({ turnPhase: 'resolving' })

      const bribeId = useGameStore.getState().pendingBribes[0].id

      respondToBribe(bribeId, true)

      const state = useGameStore.getState()
      expect(state.turnPhase).toBe('post-turn')
    })

    it('should set pendingAction to null when accepted', () => {
      const { initializePlayers, updatePlayer, submitBribe, respondToBribe } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      updatePlayer(player1.id, { inGulag: true, gulagTurns: 2 })
      submitBribe(player1.id, 500, 'gulag-escape')

      useGameStore.setState({ pendingAction: { type: 'bribe', data: {} } })

      const bribeId = useGameStore.getState().pendingBribes[0].id

      respondToBribe(bribeId, true)

      const state = useGameStore.getState()
      expect(state.pendingAction).toBeNull()
    })

    it('should handle non-existent bribe gracefully', () => {
      const { initializePlayers, respondToBribe } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players
      const initialRubles = player1.rubles
      const initialTreasury = useGameStore.getState().stateTreasury

      respondToBribe('non-existent-id', true)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.rubles).toBe(initialRubles) // No change
      expect(useGameStore.getState().stateTreasury).toBe(initialTreasury) // No change
    })

    it('should handle non-existent player gracefully', () => {
      const { initializePlayers, submitBribe, respondToBribe } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      submitBribe(player1.id, 500, 'gulag-escape')
      const bribeId = useGameStore.getState().pendingBribes[0].id

      // Manually set bribe to non-existent player
      useGameStore.setState({
        pendingBribes: [{ ...useGameStore.getState().pendingBribes[0], playerId: 'non-existent-id' }]
      })

      const initialTreasury = useGameStore.getState().stateTreasury

      respondToBribe(bribeId, true)

      // Should not add to treasury or crash
      expect(useGameStore.getState().stateTreasury).toBe(initialTreasury)
    })

    it('should not release player if not in Gulag', () => {
      const { initializePlayers, submitBribe, respondToBribe } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      // Player not in Gulag
      submitBribe(player1.id, 500, 'gulag-escape')
      const bribeId = useGameStore.getState().pendingBribes[0].id

      respondToBribe(bribeId, true)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.inGulag).toBe(false) // Still false (was already false)
    })

    it('should handle non-gulag-escape reasons when accepted', () => {
      const { initializePlayers, submitBribe, respondToBribe } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players
      const initialRubles = player1.rubles

      submitBribe(player1.id, 500, 'favour')
      const bribeId = useGameStore.getState().pendingBribes[0].id

      respondToBribe(bribeId, true)

      // Money should be taken, but no Gulag release
      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.rubles).toBe(initialRubles - 500)
      expect(updatedPlayer?.inGulag).toBe(false)
    })
  })
})

describe('gameStore - Trading System', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame()
  })

  describe('proposeTrade', () => {
    it('should create a trade offer with rubles only', () => {
      const { initializePlayers, proposeTrade } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      const [player1, player2] = useGameStore.getState().players

      proposeTrade(player1.id, player2.id, {
        offering: { rubles: 100, properties: [], gulagCards: 0, favours: 0 },
        requesting: { rubles: 200, properties: [], gulagCards: 0, favours: 0 }
      })

      const { activeTradeOffers } = useGameStore.getState()
      expect(activeTradeOffers).toHaveLength(1)
      expect(activeTradeOffers[0].fromPlayerId).toBe(player1.id)
      expect(activeTradeOffers[0].toPlayerId).toBe(player2.id)
      expect(activeTradeOffers[0].offering.rubles).toBe(100)
      expect(activeTradeOffers[0].requesting.rubles).toBe(200)
      expect(activeTradeOffers[0].status).toBe('pending')
    })

    it('should create a trade offer with properties', () => {
      const { initializePlayers, initializeProperties, proposeTrade } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      initializeProperties()
      const [player1, player2] = useGameStore.getState().players
      const properties = useGameStore.getState().properties

      // Get some property IDs
      const prop1 = properties[0].spaceId.toString()
      const prop2 = properties[1].spaceId.toString()

      proposeTrade(player1.id, player2.id, {
        offering: { rubles: 0, properties: [prop1], gulagCards: 0, favours: 0 },
        requesting: { rubles: 0, properties: [prop2], gulagCards: 0, favours: 0 }
      })

      const { activeTradeOffers } = useGameStore.getState()
      expect(activeTradeOffers).toHaveLength(1)
      expect(activeTradeOffers[0].offering.properties).toEqual([prop1])
      expect(activeTradeOffers[0].requesting.properties).toEqual([prop2])
    })

    it('should create a trade offer with mixed items', () => {
      const { initializePlayers, initializeProperties, proposeTrade } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      initializeProperties()
      const [player1, player2] = useGameStore.getState().players
      const properties = useGameStore.getState().properties
      const prop1 = properties[0].spaceId.toString()

      proposeTrade(player1.id, player2.id, {
        offering: { rubles: 100, properties: [prop1], gulagCards: 1, favours: 2 },
        requesting: { rubles: 50, properties: [], gulagCards: 0, favours: 1 }
      })

      const { activeTradeOffers } = useGameStore.getState()
      expect(activeTradeOffers).toHaveLength(1)
      expect(activeTradeOffers[0].offering.rubles).toBe(100)
      expect(activeTradeOffers[0].offering.properties).toEqual([prop1])
      expect(activeTradeOffers[0].offering.gulagCards).toBe(1)
      expect(activeTradeOffers[0].offering.favours).toBe(2)
    })

    it('should add log entry when proposing trade', () => {
      const { initializePlayers, proposeTrade } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      const [player1, player2] = useGameStore.getState().players
      const initialLogLength = useGameStore.getState().gameLog.length

      proposeTrade(player1.id, player2.id, {
        offering: { rubles: 100, properties: [], gulagCards: 0, favours: 0 },
        requesting: { rubles: 200, properties: [], gulagCards: 0, favours: 0 }
      })

      const { gameLog } = useGameStore.getState()
      expect(gameLog.length).toBe(initialLogLength + 1)
      expect(gameLog[gameLog.length - 1].message).toContain('Player 1 proposed a trade to Player 2')
    })

    it('should set pending action for trade response', () => {
      const { initializePlayers, proposeTrade } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      const [player1, player2] = useGameStore.getState().players

      proposeTrade(player1.id, player2.id, {
        offering: { rubles: 100, properties: [], gulagCards: 0, favours: 0 },
        requesting: { rubles: 200, properties: [], gulagCards: 0, favours: 0 }
      })

      const { pendingAction, activeTradeOffers } = useGameStore.getState()
      expect(pendingAction?.type).toBe('trade-response')
      expect(pendingAction?.data.tradeOfferId).toBe(activeTradeOffers[0].id)
    })

    it('should not create trade if fromPlayer does not exist', () => {
      const { initializePlayers, proposeTrade } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      proposeTrade('invalid-id', player1.id, {
        offering: { rubles: 100, properties: [], gulagCards: 0, favours: 0 },
        requesting: { rubles: 200, properties: [], gulagCards: 0, favours: 0 }
      })

      const { activeTradeOffers } = useGameStore.getState()
      expect(activeTradeOffers).toHaveLength(0)
    })

    it('should not create trade if toPlayer does not exist', () => {
      const { initializePlayers, proposeTrade } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      proposeTrade(player1.id, 'invalid-id', {
        offering: { rubles: 100, properties: [], gulagCards: 0, favours: 0 },
        requesting: { rubles: 200, properties: [], gulagCards: 0, favours: 0 }
      })

      const { activeTradeOffers } = useGameStore.getState()
      expect(activeTradeOffers).toHaveLength(0)
    })
  })

  describe('acceptTrade', () => {
    it('should transfer rubles when accepting trade', () => {
      const { initializePlayers, proposeTrade, acceptTrade, updatePlayer } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      const [player1, player2] = useGameStore.getState().players

      // Set up rubles
      updatePlayer(player1.id, { rubles: 500 })
      updatePlayer(player2.id, { rubles: 300 })

      // Need to get fresh player references after update
      const updatedPlayer1Before = useGameStore.getState().players.find(p => p.id === player1.id)!
      const updatedPlayer2Before = useGameStore.getState().players.find(p => p.id === player2.id)!

      proposeTrade(updatedPlayer1Before.id, updatedPlayer2Before.id, {
        offering: { rubles: 100, properties: [], gulagCards: 0, favours: 0 },
        requesting: { rubles: 50, properties: [], gulagCards: 0, favours: 0 }
      })

      const tradeId = useGameStore.getState().activeTradeOffers[0].id
      acceptTrade(tradeId)

      const updatedPlayers = useGameStore.getState().players
      const updatedPlayer1 = updatedPlayers.find(p => p.id === player1.id)
      const updatedPlayer2 = updatedPlayers.find(p => p.id === player2.id)

      expect(updatedPlayer1?.rubles).toBe(500 - 100 + 50) // Lost 100, gained 50
      expect(updatedPlayer2?.rubles).toBe(300 + 100 - 50) // Gained 100, lost 50
    })

    it('should transfer properties when accepting trade', () => {
      const { initializePlayers, initializeProperties, proposeTrade, acceptTrade, setPropertyCustodian, updatePlayer } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      initializeProperties()
      const [player1, player2] = useGameStore.getState().players
      const properties = useGameStore.getState().properties

      // Assign properties to players using setPropertyCustodian
      setPropertyCustodian(properties[0].spaceId, player1.id)
      setPropertyCustodian(properties[1].spaceId, player2.id)
      updatePlayer(player1.id, { properties: [properties[0].spaceId.toString()] })
      updatePlayer(player2.id, { properties: [properties[1].spaceId.toString()] })

      proposeTrade(player1.id, player2.id, {
        offering: { rubles: 0, properties: [properties[0].spaceId.toString()], gulagCards: 0, favours: 0 },
        requesting: { rubles: 0, properties: [properties[1].spaceId.toString()], gulagCards: 0, favours: 0 }
      })

      const tradeId = useGameStore.getState().activeTradeOffers[0].id
      acceptTrade(tradeId)

      const updatedProperties = useGameStore.getState().properties
      const prop0 = updatedProperties.find(p => p.spaceId === properties[0].spaceId)
      const prop1 = updatedProperties.find(p => p.spaceId === properties[1].spaceId)

      expect(prop0?.custodianId).toBe(player2.id)
      expect(prop1?.custodianId).toBe(player1.id)
    })

    it('should transfer gulag card when accepting trade', () => {
      const { initializePlayers, proposeTrade, acceptTrade, updatePlayer } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      const [player1, player2] = useGameStore.getState().players

      // Give player1 a gulag card
      updatePlayer(player1.id, { hasFreeFromGulagCard: true })

      proposeTrade(player1.id, player2.id, {
        offering: { rubles: 0, properties: [], gulagCards: 1, favours: 0 },
        requesting: { rubles: 0, properties: [], gulagCards: 0, favours: 0 }
      })

      const tradeId = useGameStore.getState().activeTradeOffers[0].id
      acceptTrade(tradeId)

      const updatedPlayers = useGameStore.getState().players
      const updatedPlayer1 = updatedPlayers.find(p => p.id === player1.id)
      const updatedPlayer2 = updatedPlayers.find(p => p.id === player2.id)

      expect(updatedPlayer1?.hasFreeFromGulagCard).toBe(false)
      expect(updatedPlayer2?.hasFreeFromGulagCard).toBe(true)
    })

    it('should transfer gulag card in requesting direction', () => {
      const { initializePlayers, proposeTrade, acceptTrade, updatePlayer } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      const [player1, player2] = useGameStore.getState().players

      // Give player2 a gulag card
      updatePlayer(player2.id, { hasFreeFromGulagCard: true })

      proposeTrade(player1.id, player2.id, {
        offering: { rubles: 0, properties: [], gulagCards: 0, favours: 0 },
        requesting: { rubles: 0, properties: [], gulagCards: 1, favours: 0 }
      })

      const tradeId = useGameStore.getState().activeTradeOffers[0].id
      acceptTrade(tradeId)

      const updatedPlayers = useGameStore.getState().players
      const updatedPlayer1 = updatedPlayers.find(p => p.id === player1.id)
      const updatedPlayer2 = updatedPlayers.find(p => p.id === player2.id)

      expect(updatedPlayer1?.hasFreeFromGulagCard).toBe(true)
      expect(updatedPlayer2?.hasFreeFromGulagCard).toBe(false)
    })

    it('should transfer favours when accepting trade', () => {
      const { initializePlayers, proposeTrade, acceptTrade, updatePlayer } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      const [player1, player2] = useGameStore.getState().players

      // Player1 owes Player2 2 favours
      updatePlayer(player1.id, { owesFavourTo: [player2.id, player2.id] })

      proposeTrade(player1.id, player2.id, {
        offering: { rubles: 0, properties: [], gulagCards: 0, favours: 1 },
        requesting: { rubles: 0, properties: [], gulagCards: 0, favours: 0 }
      })

      const tradeId = useGameStore.getState().activeTradeOffers[0].id
      acceptTrade(tradeId)

      const updatedPlayers = useGameStore.getState().players
      const updatedPlayer1 = updatedPlayers.find(p => p.id === player1.id)

      expect(updatedPlayer1?.owesFavourTo).toHaveLength(1)
    })

    it('should transfer favours in requesting direction', () => {
      const { initializePlayers, proposeTrade, acceptTrade, updatePlayer } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      const [player1, player2] = useGameStore.getState().players

      // Player2 owes Player1 2 favours
      updatePlayer(player2.id, { owesFavourTo: [player1.id, player1.id] })

      proposeTrade(player1.id, player2.id, {
        offering: { rubles: 0, properties: [], gulagCards: 0, favours: 0 },
        requesting: { rubles: 0, properties: [], gulagCards: 0, favours: 1 }
      })

      const tradeId = useGameStore.getState().activeTradeOffers[0].id
      acceptTrade(tradeId)

      const updatedPlayers = useGameStore.getState().players
      const updatedPlayer2 = updatedPlayers.find(p => p.id === player2.id)

      expect(updatedPlayer2?.owesFavourTo).toHaveLength(1)
    })

    it('should handle complex trade with multiple items', () => {
      const { initializePlayers, initializeProperties, proposeTrade, acceptTrade, updatePlayer, setPropertyCustodian } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      initializeProperties()
      const [player1, player2] = useGameStore.getState().players
      const properties = useGameStore.getState().properties

      // Set up players
      updatePlayer(player1.id, {
        rubles: 1000,
        hasFreeFromGulagCard: true,
        properties: [properties[0].spaceId.toString()]
      })
      updatePlayer(player2.id, {
        rubles: 800,
        owesFavourTo: [player1.id, player1.id],
        properties: [properties[1].spaceId.toString()]
      })
      setPropertyCustodian(properties[0].spaceId, player1.id)
      setPropertyCustodian(properties[1].spaceId, player2.id)

      proposeTrade(player1.id, player2.id, {
        offering: { rubles: 100, properties: [properties[0].spaceId.toString()], gulagCards: 1, favours: 0 },
        requesting: { rubles: 50, properties: [properties[1].spaceId.toString()], gulagCards: 0, favours: 1 }
      })

      const tradeId = useGameStore.getState().activeTradeOffers[0].id
      acceptTrade(tradeId)

      const updatedPlayers = useGameStore.getState().players
      const updatedPlayer1 = updatedPlayers.find(p => p.id === player1.id)
      const updatedPlayer2 = updatedPlayers.find(p => p.id === player2.id)
      const updatedProperties = useGameStore.getState().properties
      const prop0 = updatedProperties.find(p => p.spaceId === properties[0].spaceId)
      const prop1 = updatedProperties.find(p => p.spaceId === properties[1].spaceId)

      // Check rubles
      expect(updatedPlayer1?.rubles).toBe(1000 - 100 + 50)
      expect(updatedPlayer2?.rubles).toBe(800 + 100 - 50)

      // Check properties
      expect(prop0?.custodianId).toBe(player2.id)
      expect(prop1?.custodianId).toBe(player1.id)

      // Check gulag card
      expect(updatedPlayer1?.hasFreeFromGulagCard).toBe(false)
      expect(updatedPlayer2?.hasFreeFromGulagCard).toBe(true)

      // Check favours
      expect(updatedPlayer2?.owesFavourTo).toHaveLength(1)
    })

    it('should remove trade from activeTradeOffers after accepting', () => {
      const { initializePlayers, proposeTrade, acceptTrade } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      const [player1, player2] = useGameStore.getState().players

      proposeTrade(player1.id, player2.id, {
        offering: { rubles: 100, properties: [], gulagCards: 0, favours: 0 },
        requesting: { rubles: 50, properties: [], gulagCards: 0, favours: 0 }
      })

      expect(useGameStore.getState().activeTradeOffers).toHaveLength(1)

      const tradeId = useGameStore.getState().activeTradeOffers[0].id
      acceptTrade(tradeId)

      expect(useGameStore.getState().activeTradeOffers).toHaveLength(0)
    })

    it('should add log entry when accepting trade', () => {
      const { initializePlayers, proposeTrade, acceptTrade } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      const [player1, player2] = useGameStore.getState().players

      proposeTrade(player1.id, player2.id, {
        offering: { rubles: 100, properties: [], gulagCards: 0, favours: 0 },
        requesting: { rubles: 50, properties: [], gulagCards: 0, favours: 0 }
      })

      const initialLogLength = useGameStore.getState().gameLog.length
      const tradeId = useGameStore.getState().activeTradeOffers[0].id
      acceptTrade(tradeId)

      const { gameLog } = useGameStore.getState()
      expect(gameLog.length).toBe(initialLogLength + 1)
      expect(gameLog[gameLog.length - 1].message).toContain('Player 2 accepted trade from Player 1')
      expect(gameLog[gameLog.length - 1].type).toBe('property')
    })

    it('should do nothing if trade does not exist', () => {
      const { initializePlayers, acceptTrade, updatePlayer } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players
      updatePlayer(player1.id, { rubles: 500 })

      acceptTrade('invalid-trade-id')

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.rubles).toBe(500) // No change
    })

    it('should do nothing if fromPlayer does not exist', () => {
      const { initializePlayers, proposeTrade, acceptTrade } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      const [player1, player2] = useGameStore.getState().players

      proposeTrade(player1.id, player2.id, {
        offering: { rubles: 100, properties: [], gulagCards: 0, favours: 0 },
        requesting: { rubles: 50, properties: [], gulagCards: 0, favours: 0 }
      })

      const tradeId = useGameStore.getState().activeTradeOffers[0].id

      // Manually modify the trade to have invalid fromPlayerId
      useGameStore.setState({
        activeTradeOffers: [{
          ...useGameStore.getState().activeTradeOffers[0],
          fromPlayerId: 'invalid-id'
        }]
      })

      const initialLogLength = useGameStore.getState().gameLog.length
      acceptTrade(tradeId)

      // Trade should not be removed
      expect(useGameStore.getState().activeTradeOffers).toHaveLength(1)
      // No log entry should be added
      expect(useGameStore.getState().gameLog.length).toBe(initialLogLength)
    })
  })

  describe('rejectTrade', () => {
    it('should remove trade from activeTradeOffers when rejecting', () => {
      const { initializePlayers, proposeTrade, rejectTrade } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      const [player1, player2] = useGameStore.getState().players

      proposeTrade(player1.id, player2.id, {
        offering: { rubles: 100, properties: [], gulagCards: 0, favours: 0 },
        requesting: { rubles: 50, properties: [], gulagCards: 0, favours: 0 }
      })

      expect(useGameStore.getState().activeTradeOffers).toHaveLength(1)

      const tradeId = useGameStore.getState().activeTradeOffers[0].id
      rejectTrade(tradeId)

      expect(useGameStore.getState().activeTradeOffers).toHaveLength(0)
    })

    it('should add log entry when rejecting trade', () => {
      const { initializePlayers, proposeTrade, rejectTrade } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      const [player1, player2] = useGameStore.getState().players

      proposeTrade(player1.id, player2.id, {
        offering: { rubles: 100, properties: [], gulagCards: 0, favours: 0 },
        requesting: { rubles: 50, properties: [], gulagCards: 0, favours: 0 }
      })

      const initialLogLength = useGameStore.getState().gameLog.length
      const tradeId = useGameStore.getState().activeTradeOffers[0].id
      rejectTrade(tradeId)

      const { gameLog } = useGameStore.getState()
      expect(gameLog.length).toBe(initialLogLength + 1)
      expect(gameLog[gameLog.length - 1].message).toContain('Player 2 rejected trade from Player 1')
      expect(gameLog[gameLog.length - 1].type).toBe('system')
    })

    it('should not transfer any items when rejecting trade', () => {
      const { initializePlayers, proposeTrade, rejectTrade, updatePlayer } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      const [player1, player2] = useGameStore.getState().players

      updatePlayer(player1.id, { rubles: 500 })
      updatePlayer(player2.id, { rubles: 300 })

      proposeTrade(player1.id, player2.id, {
        offering: { rubles: 100, properties: [], gulagCards: 0, favours: 0 },
        requesting: { rubles: 50, properties: [], gulagCards: 0, favours: 0 }
      })

      const tradeId = useGameStore.getState().activeTradeOffers[0].id
      rejectTrade(tradeId)

      const updatedPlayers = useGameStore.getState().players
      const updatedPlayer1 = updatedPlayers.find(p => p.id === player1.id)
      const updatedPlayer2 = updatedPlayers.find(p => p.id === player2.id)

      expect(updatedPlayer1?.rubles).toBe(500)
      expect(updatedPlayer2?.rubles).toBe(300)
    })

    it('should do nothing if trade does not exist', () => {
      const { initializePlayers, rejectTrade } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const initialLogLength = useGameStore.getState().gameLog.length

      rejectTrade('invalid-trade-id')

      expect(useGameStore.getState().gameLog.length).toBe(initialLogLength)
    })

    it('should handle rejection when fromPlayer does not exist', () => {
      const { initializePlayers, proposeTrade, rejectTrade } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false },
        { name: 'Player 2', piece: 'hammer', isStalin: false }
      ])

      const [player1, player2] = useGameStore.getState().players

      proposeTrade(player1.id, player2.id, {
        offering: { rubles: 100, properties: [], gulagCards: 0, favours: 0 },
        requesting: { rubles: 50, properties: [], gulagCards: 0, favours: 0 }
      })

      const tradeId = useGameStore.getState().activeTradeOffers[0].id

      // Manually modify the trade to have invalid fromPlayerId
      useGameStore.setState({
        activeTradeOffers: [{
          ...useGameStore.getState().activeTradeOffers[0],
          fromPlayerId: 'invalid-id'
        }]
      })

      const initialLogLength = useGameStore.getState().gameLog.length
      rejectTrade(tradeId)

      // Trade should still be removed
      expect(useGameStore.getState().activeTradeOffers).toHaveLength(0)
      // No log entry should be added (because players don't exist)
      expect(useGameStore.getState().gameLog.length).toBe(initialLogLength)
    })
  })
})

// ============================================================================
// Category J: Debt & Elimination
// ============================================================================

describe('gameStore - Debt & Elimination', () => {
  const setupPlayers = () => {
    const { initializePlayers } = useGameStore.getState()
    initializePlayers([
      { name: 'Player 1', piece: 'sickle', isStalin: false },
      { name: 'Player 2', piece: 'hammer', isStalin: false },
      { name: 'Player 3', piece: 'star', isStalin: false },
      { name: 'Stalin', piece: 'boot', isStalin: true }
    ])
  }

  beforeEach(() => {
    useGameStore.getState().resetGame()
    setupPlayers()
  })

  describe('createDebt()', () => {
    it('should create debt for player with correct properties', () => {
      const { createDebt, players } = useGameStore.getState()
      const player = players[0]

      createDebt(player.id, 'state', 500, 'unpaid rent')

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player.id)
      expect(updatedPlayer?.debt).toBeDefined()
      expect(updatedPlayer?.debt?.amount).toBe(500)
      expect(updatedPlayer?.debt?.creditorId).toBe('state')
      expect(updatedPlayer?.debt?.reason).toBe('unpaid rent')
      expect(updatedPlayer?.debt?.createdAtRound).toBe(1)
      expect(updatedPlayer?.debtCreatedAtRound).toBe(1)
    })

    it('should create debt to another player', () => {
      const { createDebt, players } = useGameStore.getState()
      const debtor = players[0]
      const creditor = players[1]

      createDebt(debtor.id, creditor.id, 300, 'property rent')

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === debtor.id)
      expect(updatedPlayer?.debt).toBeDefined()
      expect(updatedPlayer?.debt?.creditorId).toBe(creditor.id)
      expect(updatedPlayer?.debt?.amount).toBe(300)
    })

    it('should add log entry when debt is created', () => {
      const { createDebt, players } = useGameStore.getState()
      const player = players[0]
      const initialLogLength = useGameStore.getState().gameLog.length

      createDebt(player.id, 'state', 500, 'unpaid rent')

      const logs = useGameStore.getState().gameLog
      expect(logs.length).toBe(initialLogLength + 1)
      expect(logs[logs.length - 1].type).toBe('payment')
      expect(logs[logs.length - 1].message).toContain('owes ₽500')
      expect(logs[logs.length - 1].message).toContain('the State')
      expect(logs[logs.length - 1].message).toContain('unpaid rent')
    })

    it('should handle invalid player id gracefully', () => {
      const { createDebt } = useGameStore.getState()
      const initialState = useGameStore.getState()

      createDebt('invalid-id', 'state', 500, 'test')

      const newState = useGameStore.getState()
      expect(newState.players).toEqual(initialState.players)
    })

    it('should include creditor name in log entry for player debt', () => {
      const { createDebt, players } = useGameStore.getState()
      const debtor = players[0]
      const creditor = players[1]

      createDebt(debtor.id, creditor.id, 300, 'property rent')

      const logs = useGameStore.getState().gameLog
      expect(logs[logs.length - 1].message).toContain(creditor.name)
    })
  })

  describe('checkDebtStatus()', () => {
    it('should send player to gulag when debt is past due (2 rounds)', () => {
      const { createDebt, checkDebtStatus, players } = useGameStore.getState()
      const player = players[0]

      // Create debt in round 1
      createDebt(player.id, 'state', 500, 'unpaid rent')

      // Advance to round 3 (1 round after debt created = round 2, so round 3 is past due)
      useGameStore.setState({ roundNumber: 3 })

      checkDebtStatus()

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player.id)
      expect(updatedPlayer?.inGulag).toBe(true)
      expect(updatedPlayer?.debt).toBeNull()
      expect(updatedPlayer?.debtCreatedAtRound).toBeNull()
    })

    it('should not send player to gulag if debt is not past due (within 1 round)', () => {
      const { createDebt, checkDebtStatus, players } = useGameStore.getState()
      const player = players[0]

      // Create debt in round 1
      createDebt(player.id, 'state', 500, 'unpaid rent')

      // Advance to round 2 (within 1 round grace period)
      useGameStore.setState({ roundNumber: 2 })

      checkDebtStatus()

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player.id)
      expect(updatedPlayer?.inGulag).toBe(false)
      expect(updatedPlayer?.debt).toBeDefined()
    })

    it('should handle multiple players with debt', () => {
      const { createDebt, checkDebtStatus, players } = useGameStore.getState()
      const player1 = players[0]
      const player2 = players[1]

      // Create debts for both players
      createDebt(player1.id, 'state', 500, 'rent')
      createDebt(player2.id, 'state', 300, 'tax')

      // Advance to round 3 (past due)
      useGameStore.setState({ roundNumber: 3 })

      checkDebtStatus()

      const updatedPlayer1 = useGameStore.getState().players.find(p => p.id === player1.id)
      const updatedPlayer2 = useGameStore.getState().players.find(p => p.id === player2.id)

      expect(updatedPlayer1?.inGulag).toBe(true)
      expect(updatedPlayer2?.inGulag).toBe(true)
      expect(updatedPlayer1?.debt).toBeNull()
      expect(updatedPlayer2?.debt).toBeNull()
    })

    it('should not affect players without debt', () => {
      const { createDebt, checkDebtStatus, players } = useGameStore.getState()
      const playerWithDebt = players[0]
      const playerWithoutDebt = players[1]

      createDebt(playerWithDebt.id, 'state', 500, 'rent')

      useGameStore.setState({ roundNumber: 3 })
      checkDebtStatus()

      const updatedPlayerWithoutDebt = useGameStore.getState().players.find(p => p.id === playerWithoutDebt.id)
      expect(updatedPlayerWithoutDebt?.inGulag).toBe(false)
      expect(updatedPlayerWithoutDebt?.debt).toBeNull()
    })
  })

  describe('eliminatePlayer()', () => {
    it('should eliminate player and set isEliminated to true', () => {
      const { eliminatePlayer, players } = useGameStore.getState()
      const player = players[0]

      eliminatePlayer(player.id, 'bankruptcy')

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player.id)
      expect(updatedPlayer?.isEliminated).toBe(true)
      expect(updatedPlayer?.eliminationReason).toBe('bankruptcy')
    })

    it('should return all properties to State', () => {
      const { setPropertyCustodian, updatePlayer, eliminatePlayer, players } = useGameStore.getState()
      const player = players[0]

      // Give player some properties (space IDs 3 and 6)
      const prop1 = 3 // Brown property
      const prop2 = 6 // Light blue property

      setPropertyCustodian(prop1, player.id)
      setPropertyCustodian(prop2, player.id)
      updatePlayer(player.id, { properties: [prop1.toString(), prop2.toString()] })

      const playerBefore = useGameStore.getState().players.find(p => p.id === player.id)
      expect(playerBefore?.properties.length).toBeGreaterThan(0)

      eliminatePlayer(player.id, 'bankruptcy')

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player.id)
      expect(updatedPlayer?.properties).toEqual([])

      // Check that properties are returned to state (custodian set to null)
      const property1 = useGameStore.getState().properties.find(p => p.spaceId === prop1)
      expect(property1?.custodianId).toBeNull()

      const property2 = useGameStore.getState().properties.find(p => p.spaceId === prop2)
      expect(property2?.custodianId).toBeNull()
    })

    it('should reset collectivization levels on properties', () => {
      const { setPropertyCustodian, updateCollectivizationLevel, eliminatePlayer, players, properties } = useGameStore.getState()
      const player = players[0]

      const prop = properties.find(p => p.color === 'brown')?.spaceId
      if (prop) {
        setPropertyCustodian(prop, player.id)
        updateCollectivizationLevel(prop, 3)

        const propertyBefore = useGameStore.getState().properties.find(p => p.spaceId === prop)
        expect(propertyBefore?.collectivizationLevel).toBe(3)

        eliminatePlayer(player.id, 'bankruptcy')

        const propertyAfter = useGameStore.getState().properties.find(p => p.spaceId === prop)
        expect(propertyAfter?.collectivizationLevel).toBe(0)
      }
    })

    it('should remove player from gulag if in gulag', () => {
      const { sendToGulag, eliminatePlayer, players } = useGameStore.getState()
      const player = players[0]

      sendToGulag(player.id, 'debtDefault')

      const playerBefore = useGameStore.getState().players.find(p => p.id === player.id)
      expect(playerBefore?.inGulag).toBe(true)

      eliminatePlayer(player.id, 'bankruptcy')

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player.id)
      expect(updatedPlayer?.inGulag).toBe(false)
    })

    it('should record elimination details (round, wealth, rank, properties)', () => {
      const { setPropertyCustodian, eliminatePlayer, updatePlayer, players } = useGameStore.getState()
      const player = players[0]

      // Set up player state (space ID 3 = brown property)
      const prop = 3
      setPropertyCustodian(prop, player.id)
      updatePlayer(player.id, { properties: [prop.toString()], rubles: 250 })
      useGameStore.setState({ roundNumber: 5 })

      eliminatePlayer(player.id, 'bankruptcy')

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player.id)
      expect(updatedPlayer?.eliminationTurn).toBe(5)
      expect(updatedPlayer?.finalWealth).toBe(250)
      expect(updatedPlayer?.finalRank).toBe(player.rank)
      expect(updatedPlayer?.finalProperties).toBe(1)
    })

    it('should add appropriate log entry for bankruptcy', () => {
      const { eliminatePlayer, players } = useGameStore.getState()
      const player = players[0]
      const initialLogLength = useGameStore.getState().gameLog.length

      eliminatePlayer(player.id, 'bankruptcy')

      const logs = useGameStore.getState().gameLog
      expect(logs.length).toBe(initialLogLength + 1)
      expect(logs[logs.length - 1].type).toBe('system')
      expect(logs[logs.length - 1].message).toContain(player.name)
      expect(logs[logs.length - 1].message).toContain('bankruptcy')
      expect(logs[logs.length - 1].message).toContain('Enemy of the People')
    })

    it('should add appropriate log entry for execution', () => {
      const { eliminatePlayer, players } = useGameStore.getState()
      const player = players[0]

      eliminatePlayer(player.id, 'execution')

      const logs = useGameStore.getState().gameLog
      expect(logs[logs.length - 1].message).toContain('executed by order of Stalin')
      expect(logs[logs.length - 1].message).toContain('Ghost of the Revolution')
    })

    it('should add appropriate log entry for gulag timeout', () => {
      const { eliminatePlayer, players } = useGameStore.getState()
      const player = players[0]

      eliminatePlayer(player.id, 'gulagTimeout')

      const logs = useGameStore.getState().gameLog
      expect(logs[logs.length - 1].message).toContain('died in the Gulag')
      expect(logs[logs.length - 1].message).toContain('10 turns')
    })

    it('should call checkGameEnd after elimination', () => {
      const { eliminatePlayer, players } = useGameStore.getState()

      // Eliminate all non-Stalin players except one
      const nonStalinPlayers = players.filter(p => !p.isStalin)
      for (let i = 0; i < nonStalinPlayers.length - 1; i++) {
        eliminatePlayer(nonStalinPlayers[i].id, 'bankruptcy')
      }

      // Game should end with survivor victory
      const state = useGameStore.getState()
      expect(state.gamePhase).toBe('ended')
      expect(state.gameEndCondition).toBe('survivor')
      expect(state.winnerId).toBe(nonStalinPlayers[nonStalinPlayers.length - 1].id)
    })

    it('should handle invalid player id gracefully', () => {
      const { eliminatePlayer } = useGameStore.getState()
      const initialState = useGameStore.getState()

      eliminatePlayer('invalid-id', 'bankruptcy')

      const newState = useGameStore.getState()
      expect(newState.players).toEqual(initialState.players)
    })
  })

  describe('checkElimination()', () => {
    it('should eliminate player with negative total wealth and debt', () => {
      const { updatePlayer, createDebt, checkElimination, players } = useGameStore.getState()
      const player = players[0]

      // Set player to negative wealth and create debt
      updatePlayer(player.id, { rubles: -100 })
      createDebt(player.id, 'state', 500, 'rent')

      const eliminated = checkElimination(player.id)

      expect(eliminated).toBe(true)
      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player.id)
      expect(updatedPlayer?.isEliminated).toBe(true)
      expect(updatedPlayer?.eliminationReason).toBe('bankruptcy')
    })

    it('should not eliminate player with negative rubles but no debt', () => {
      const { updatePlayer, checkElimination, players } = useGameStore.getState()
      const player = players[0]

      updatePlayer(player.id, { rubles: -100 })

      const eliminated = checkElimination(player.id)

      expect(eliminated).toBe(false)
      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player.id)
      expect(updatedPlayer?.isEliminated).toBe(false)
    })

    it('should not eliminate player with positive total wealth despite debt', () => {
      const { updatePlayer, createDebt, setPropertyCustodian, checkElimination, players } = useGameStore.getState()
      const player = players[0]

      // Give player valuable properties (space ID 39 = dark blue/Kremlin property)
      const prop = 39
      setPropertyCustodian(prop, player.id)
      updatePlayer(player.id, { properties: [prop.toString()], rubles: -50 })
      createDebt(player.id, 'state', 100, 'rent')

      const eliminated = checkElimination(player.id)

      expect(eliminated).toBe(false)
    })

    it('should not check elimination for Stalin', () => {
      const { updatePlayer, checkElimination, players } = useGameStore.getState()
      const stalin = players.find(p => p.isStalin)

      if (stalin) {
        updatePlayer(stalin.id, { rubles: -1000 })

        const eliminated = checkElimination(stalin.id)

        expect(eliminated).toBe(false)
        const updatedStalin = useGameStore.getState().players.find(p => p.id === stalin.id)
        expect(updatedStalin?.isEliminated).toBe(false)
      }
    })

    it('should not check elimination for already eliminated player', () => {
      const { eliminatePlayer, updatePlayer, createDebt, checkElimination, players } = useGameStore.getState()
      const player = players[0]

      eliminatePlayer(player.id, 'execution')

      // Try to trigger another elimination
      updatePlayer(player.id, { rubles: -1000 })
      createDebt(player.id, 'state', 500, 'test')

      const eliminated = checkElimination(player.id)

      expect(eliminated).toBe(false)
    })

    it('should return false for invalid player id', () => {
      const { checkElimination } = useGameStore.getState()

      const eliminated = checkElimination('invalid-id')

      expect(eliminated).toBe(false)
    })
  })

  describe('checkGameEnd()', () => {
    it('should end game with survivor victory when 1 player remains', () => {
      const { eliminatePlayer, checkGameEnd, players } = useGameStore.getState()

      // Eliminate all players except one (skip Stalin)
      const nonStalinPlayers = players.filter(p => !p.isStalin)
      for (let i = 0; i < nonStalinPlayers.length - 1; i++) {
        eliminatePlayer(nonStalinPlayers[i].id, 'bankruptcy')
      }

      const result = checkGameEnd()
      const state = useGameStore.getState()

      expect(result).toBe('survivor')
      expect(state.gamePhase).toBe('ended')
      expect(state.gameEndCondition).toBe('survivor')
      expect(state.winnerId).toBe(nonStalinPlayers[nonStalinPlayers.length - 1].id)
    })

    it('should end game with Stalin victory when all players eliminated', () => {
      const { eliminatePlayer, checkGameEnd, players } = useGameStore.getState()

      // Eliminate all non-Stalin players
      const nonStalinPlayers = players.filter(p => !p.isStalin)
      nonStalinPlayers.forEach(p => {
        eliminatePlayer(p.id, 'execution')
      })

      const result = checkGameEnd()
      const state = useGameStore.getState()

      expect(result).toBe('stalinWins')
      expect(state.gamePhase).toBe('ended')
      expect(state.gameEndCondition).toBe('stalinWins')
      expect(state.winnerId).toBeNull()
    })

    it('should not end game when multiple players remain', () => {
      const { checkGameEnd } = useGameStore.getState()

      const result = checkGameEnd()
      const state = useGameStore.getState()

      expect(result).toBeNull()
      expect(state.gamePhase).not.toBe('ended')
    })

    it('should not end game when 2 players remain', () => {
      const { eliminatePlayer, checkGameEnd, players } = useGameStore.getState()

      // Eliminate all but 2 players (excluding Stalin)
      const nonStalinPlayers = players.filter(p => !p.isStalin)
      for (let i = 0; i < nonStalinPlayers.length - 2; i++) {
        eliminatePlayer(nonStalinPlayers[i].id, 'bankruptcy')
      }

      const result = checkGameEnd()
      const state = useGameStore.getState()

      expect(result).toBeNull()
      expect(state.gamePhase).not.toBe('ended')
    })
  })
})

describe('gameStore - End Game Voting', () => {
  const setupPlayers = () => {
    const { initializePlayers } = useGameStore.getState()
    initializePlayers([
      { name: 'Player 1', piece: 'sickle', isStalin: false },
      { name: 'Player 2', piece: 'hammer', isStalin: false },
      { name: 'Player 3', piece: 'star', isStalin: false },
      { name: 'Stalin', piece: 'boot', isStalin: true }
    ])
  }

  beforeEach(() => {
    useGameStore.getState().resetGame()
    setupPlayers()
  })

  describe('initiateEndVote()', () => {
    it('should initiate end game vote with correct state', () => {
      const { initiateEndVote, players } = useGameStore.getState()
      const initiator = players[0]

      initiateEndVote(initiator.id)

      const state = useGameStore.getState()
      expect(state.endVoteInProgress).toBe(true)
      expect(state.endVoteInitiator).toBe(initiator.id)
      expect(state.endVotes).toEqual({})
    })

    it('should add log entry when end vote is initiated', () => {
      const { initiateEndVote, players } = useGameStore.getState()
      const initiator = players[0]
      const initialLogLength = useGameStore.getState().gameLog.length

      initiateEndVote(initiator.id)

      const logs = useGameStore.getState().gameLog
      expect(logs.length).toBe(initialLogLength + 1)
      expect(logs[logs.length - 1].type).toBe('system')
      expect(logs[logs.length - 1].message).toContain(initiator.name)
      expect(logs[logs.length - 1].message).toContain('initiated a vote to end the game')
      expect(logs[logs.length - 1].message).toContain('unanimously')
    })

    it('should handle unknown initiator gracefully', () => {
      const { initiateEndVote } = useGameStore.getState()

      initiateEndVote('unknown-id')

      const state = useGameStore.getState()
      expect(state.endVoteInProgress).toBe(true)
      expect(state.endVoteInitiator).toBe('unknown-id')

      const logs = useGameStore.getState().gameLog
      expect(logs[logs.length - 1].message).toContain('Unknown')
    })
  })

  describe('castEndVote()', () => {
    it('should record vote for a player', () => {
      const { initiateEndVote, castEndVote, players } = useGameStore.getState()
      const initiator = players[0]

      initiateEndVote(initiator.id)
      castEndVote(initiator.id, true)

      const state = useGameStore.getState()
      expect(state.endVotes[initiator.id]).toBe(true)
    })

    it('should add log entry when player votes', () => {
      const { initiateEndVote, castEndVote, players } = useGameStore.getState()
      const voter = players[0]

      initiateEndVote(voter.id)
      const initialLogLength = useGameStore.getState().gameLog.length

      castEndVote(voter.id, true)

      const logs = useGameStore.getState().gameLog
      expect(logs.length).toBe(initialLogLength + 1)
      expect(logs[logs.length - 1].type).toBe('system')
      expect(logs[logs.length - 1].message).toContain(voter.name)
      expect(logs[logs.length - 1].message).toContain('voted YES')
    })

    it('should add log entry for NO vote', () => {
      const { initiateEndVote, castEndVote, players } = useGameStore.getState()
      const voter = players[0]

      initiateEndVote(voter.id)
      castEndVote(voter.id, false)

      const logs = useGameStore.getState().gameLog
      expect(logs[logs.length - 1].message).toContain('voted NO')
    })

    it('should end game when all players vote YES unanimously', () => {
      const { initiateEndVote, castEndVote, players } = useGameStore.getState()
      const nonStalinPlayers = players.filter(p => !p.isStalin)

      initiateEndVote(nonStalinPlayers[0].id)

      // All non-Stalin players vote YES
      nonStalinPlayers.forEach(player => {
        castEndVote(player.id, true)
      })

      const state = useGameStore.getState()
      expect(state.gamePhase).toBe('ended')
      expect(state.gameEndCondition).toBe('unanimous')
      expect(state.winnerId).toBeNull()
    })

    it('should not end game when vote is not unanimous', () => {
      const { initiateEndVote, castEndVote, players } = useGameStore.getState()
      const nonStalinPlayers = players.filter(p => !p.isStalin)

      initiateEndVote(nonStalinPlayers[0].id)

      // First two vote YES, last one votes NO
      castEndVote(nonStalinPlayers[0].id, true)
      castEndVote(nonStalinPlayers[1].id, true)
      castEndVote(nonStalinPlayers[2].id, false)

      const state = useGameStore.getState()
      expect(state.gamePhase).not.toBe('ended')
      expect(state.endVoteInProgress).toBe(false)
      expect(state.endVoteInitiator).toBeNull()
      expect(state.endVotes).toEqual({})
    })

    it('should add log entry when vote fails', () => {
      const { initiateEndVote, castEndVote, players } = useGameStore.getState()
      const nonStalinPlayers = players.filter(p => !p.isStalin)

      initiateEndVote(nonStalinPlayers[0].id)

      // Vote YES, YES, NO
      castEndVote(nonStalinPlayers[0].id, true)
      castEndVote(nonStalinPlayers[1].id, true)
      const initialLogLength = useGameStore.getState().gameLog.length
      castEndVote(nonStalinPlayers[2].id, false)

      const logs = useGameStore.getState().gameLog
      expect(logs[logs.length - 1].type).toBe('system')
      expect(logs[logs.length - 1].message).toContain('End vote failed')
      expect(logs[logs.length - 1].message).toContain('not unanimous')
    })

    it('should not count votes from eliminated players', () => {
      const { initiateEndVote, castEndVote, eliminatePlayer, players } = useGameStore.getState()
      const nonStalinPlayers = players.filter(p => !p.isStalin)

      // Eliminate the third player
      eliminatePlayer(nonStalinPlayers[2].id, 'bankruptcy')

      initiateEndVote(nonStalinPlayers[0].id)

      // Only the two remaining players vote YES
      castEndVote(nonStalinPlayers[0].id, true)
      castEndVote(nonStalinPlayers[1].id, true)

      // Should end game since all active players voted YES
      const state = useGameStore.getState()
      expect(state.gamePhase).toBe('ended')
      expect(state.gameEndCondition).toBe('unanimous')
    })

    it('should not count votes from Stalin', () => {
      const { initiateEndVote, castEndVote, players } = useGameStore.getState()
      const nonStalinPlayers = players.filter(p => !p.isStalin)
      const stalin = players.find(p => p.isStalin)

      initiateEndVote(nonStalinPlayers[0].id)

      // All non-Stalin players vote YES
      nonStalinPlayers.forEach(player => {
        castEndVote(player.id, true)
      })

      // Should end even though Stalin hasn't voted (Stalin's vote is not counted)
      const state = useGameStore.getState()
      expect(state.gamePhase).toBe('ended')
    })

    it('should wait for all active players to vote before checking result', () => {
      const { initiateEndVote, castEndVote, players } = useGameStore.getState()
      const nonStalinPlayers = players.filter(p => !p.isStalin)

      initiateEndVote(nonStalinPlayers[0].id)

      // Only first player votes
      castEndVote(nonStalinPlayers[0].id, true)

      const state = useGameStore.getState()
      expect(state.gamePhase).not.toBe('ended')
      expect(state.endVoteInProgress).toBe(true)
    })

    it('should handle unknown voter gracefully', () => {
      const { initiateEndVote, castEndVote } = useGameStore.getState()

      initiateEndVote('player-1')
      castEndVote('unknown-id', true)

      const logs = useGameStore.getState().gameLog
      expect(logs[logs.length - 1].message).toContain('Unknown')
    })

    it('should allow player to change their vote', () => {
      const { initiateEndVote, castEndVote, players } = useGameStore.getState()
      const nonStalinPlayers = players.filter(p => !p.isStalin)

      initiateEndVote(nonStalinPlayers[0].id)

      // First player votes NO
      castEndVote(nonStalinPlayers[0].id, false)
      expect(useGameStore.getState().endVotes[nonStalinPlayers[0].id]).toBe(false)

      // First player changes to YES
      castEndVote(nonStalinPlayers[0].id, true)
      expect(useGameStore.getState().endVotes[nonStalinPlayers[0].id]).toBe(true)
    })
  })
})

describe('gameStore - Confession System', () => {
  const setupPlayers = () => {
    const { initializePlayers } = useGameStore.getState()
    initializePlayers([
      { name: 'Player 1', piece: 'sickle', isStalin: false },
      { name: 'Player 2', piece: 'hammer', isStalin: false },
      { name: 'Player 3', piece: 'star', isStalin: false },
      { name: 'Stalin', piece: 'boot', isStalin: true }
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
      sendToGulag(prisoner.id, 'HARD_LABOR')

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

      sendToGulag(prisoner.id, 'HARD_LABOR')

      const now = Date.now()
      vi.setSystemTime(now)

      submitConfession(prisoner.id, 'First confession')

      const state = useGameStore.getState()
      expect(state.confessions[0].id).toBe(`confession-${now}`)
    })

    it('should set confession timestamp', () => {
      const { submitConfession, sendToGulag, players } = useGameStore.getState()
      const prisoner = players[0]

      sendToGulag(prisoner.id, 'HARD_LABOR')

      const now = new Date()
      vi.setSystemTime(now)

      submitConfession(prisoner.id, 'My confession')

      const state = useGameStore.getState()
      expect(state.confessions[0].timestamp).toEqual(now)
    })

    it('should add log entry when confession is submitted', () => {
      const { submitConfession, sendToGulag, players } = useGameStore.getState()
      const prisoner = players[0]

      sendToGulag(prisoner.id, 'HARD_LABOR')

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

      sendToGulag(prisoner.id, 'HARD_LABOR')
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

      sendToGulag(prisoner.id, 'HARD_LABOR')

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

      sendToGulag(prisoner1.id, 'HARD_LABOR')
      sendToGulag(prisoner2.id, 'HARD_LABOR')

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

      sendToGulag(prisoner.id, 'HARD_LABOR')
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

      sendToGulag(prisoner.id, 'HARD_LABOR')
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

      sendToGulag(prisoner.id, 'HARD_LABOR')
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

      sendToGulag(prisoner.id, 'HARD_LABOR')
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

      sendToGulag(prisoner.id, 'HARD_LABOR')
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

      sendToGulag(prisoner.id, 'HARD_LABOR')
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

      sendToGulag(prisoner.id, 'HARD_LABOR')
      submitConfession(prisoner.id, 'My confession')

      const confessionId = useGameStore.getState().confessions[0].id
      reviewConfession(confessionId, true)

      const state = useGameStore.getState()
      expect(state.pendingAction).toBeNull()
    })

    it('should not review already reviewed confession', () => {
      const { submitConfession, reviewConfession, sendToGulag, players } = useGameStore.getState()
      const prisoner = players[0]

      sendToGulag(prisoner.id, 'HARD_LABOR')
      submitConfession(prisoner.id, 'My confession')

      const confessionId = useGameStore.getState().confessions[0].id

      // First review - accept
      reviewConfession(confessionId, true)
      expect(useGameStore.getState().players.find(p => p.id === prisoner.id)?.inGulag).toBe(false)

      // Put player back in gulag
      sendToGulag(prisoner.id, 'HARD_LABOR')

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

      sendToGulag(prisoner.id, 'HARD_LABOR')
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
