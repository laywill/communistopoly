// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { describe, it, expect } from 'vitest'
import { calculateTotalWealth, initializePlayerStats } from '../../../store/gameStore'
import type { Player, Property } from '../../../types/game'

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
