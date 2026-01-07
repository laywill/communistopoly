// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { describe, it, expect } from 'vitest'
import {
  ownsCompleteGroup,
  calculateQuota,
  calculateRailwayFee,
  calculateUtilityFee,
  canPurchaseProperty,
  getRankDiscount,
  calculateTotalWealth,
  canImproveProperty,
  getRailwayCount,
  getUtilityCount
} from '../../utils/propertyUtils'
import { createTestPlayer, createTestProperty } from '../helpers/gameStateHelpers'
import { Property, Player } from '../../types/game'

describe('propertyUtils', () => {
  describe('ownsCompleteGroup', () => {
    it('should return true when player owns all properties in Siberian group', () => {
      const properties: Property[] = [
        createTestProperty(1, { custodianId: 'player-1' }), // Camp Vorkuta
        createTestProperty(3, { custodianId: 'player-1' })  // Camp Kolyma
      ]
      const result = ownsCompleteGroup('player-1', 'siberian', properties)
      expect(result).toBe(true)
    })

    it('should return false when player owns only one property in Siberian group', () => {
      const properties: Property[] = [
        createTestProperty(1, { custodianId: 'player-1' }), // Camp Vorkuta
        createTestProperty(3, { custodianId: 'player-2' })  // Camp Kolyma
      ]
      const result = ownsCompleteGroup('player-1', 'siberian', properties)
      expect(result).toBe(false)
    })

    it('should return true when player owns all Collective Farm properties', () => {
      const properties: Property[] = [
        createTestProperty(6, { custodianId: 'player-1' }), // Kolkhoz Sunrise
        createTestProperty(8, { custodianId: 'player-1' }), // Kolkhoz Progress
        createTestProperty(9, { custodianId: 'player-1' })  // Kolkhoz Victory
      ]
      const result = ownsCompleteGroup('player-1', 'collective', properties)
      expect(result).toBe(true)
    })

    it('should return false when player is missing one property in group', () => {
      const properties: Property[] = [
        createTestProperty(6, { custodianId: 'player-1' }), // Kolkhoz Sunrise
        createTestProperty(8, { custodianId: 'player-1' }), // Kolkhoz Progress
        createTestProperty(9, { custodianId: 'player-2' })  // Kolkhoz Victory - different owner
      ]
      const result = ownsCompleteGroup('player-1', 'collective', properties)
      expect(result).toBe(false)
    })

    it('should return false when property has no custodian', () => {
      const properties: Property[] = [
        createTestProperty(1, { custodianId: 'player-1' }), // Camp Vorkuta
        createTestProperty(3, { custodianId: null })        // Camp Kolyma - no owner
      ]
      const result = ownsCompleteGroup('player-1', 'siberian', properties)
      expect(result).toBe(false)
    })
  })

  describe('calculateUtilityFee', () => {
    it('should calculate fee with 4x multiplier when owning one utility', () => {
      const properties: Property[] = [
        createTestProperty(12, { custodianId: 'player-1' }), // Pravda Press
        createTestProperty(28, { custodianId: 'player-2' })  // Radio Moscow
      ]
      const fee = calculateUtilityFee('player-1', 7, properties)
      expect(fee).toBe(28) // 7 * 4
    })

    it('should calculate fee with 10x multiplier when owning both utilities', () => {
      const properties: Property[] = [
        createTestProperty(12, { custodianId: 'player-1' }), // Pravda Press
        createTestProperty(28, { custodianId: 'player-1' })  // Radio Moscow
      ]
      const fee = calculateUtilityFee('player-1', 7, properties)
      expect(fee).toBe(70) // 7 * 10
    })

    it('should calculate different fees based on dice roll with one utility', () => {
      const properties: Property[] = [
        createTestProperty(12, { custodianId: 'player-1' }), // Pravda Press
        createTestProperty(28, { custodianId: 'player-2' })  // Radio Moscow
      ]
      expect(calculateUtilityFee('player-1', 3, properties)).toBe(12) // 3 * 4
      expect(calculateUtilityFee('player-1', 10, properties)).toBe(40) // 10 * 4
    })

    it('should handle different dice totals correctly', () => {
      const properties: Property[] = [
        createTestProperty(12, { custodianId: 'player-1' }), // Pravda Press
        createTestProperty(28, { custodianId: 'player-1' })  // Radio Moscow
      ]
      expect(calculateUtilityFee('player-1', 2, properties)).toBe(20)  // 2 * 10
      expect(calculateUtilityFee('player-1', 12, properties)).toBe(120) // 12 * 10
    })
  })

  describe('canPurchaseProperty', () => {
    it('should allow proletariat to purchase regular properties', () => {
      const player = createTestPlayer({ rank: 'proletariat' })
      expect(canPurchaseProperty(player, 'siberian')).toBe(true)
      expect(canPurchaseProperty(player, 'collective')).toBe(true)
      expect(canPurchaseProperty(player, 'industrial')).toBe(true)
      expect(canPurchaseProperty(player, 'military')).toBe(true)
      expect(canPurchaseProperty(player, 'railroad')).toBe(true)
    })

    it('should prevent proletariat from purchasing elite properties', () => {
      const player = createTestPlayer({ rank: 'proletariat' })
      expect(canPurchaseProperty(player, 'elite')).toBe(false)
    })

    it('should prevent proletariat from purchasing Kremlin properties', () => {
      const player = createTestPlayer({ rank: 'proletariat' })
      expect(canPurchaseProperty(player, 'kremlin')).toBe(false)
    })

    it('should prevent proletariat from purchasing utilities', () => {
      const player = createTestPlayer({ rank: 'proletariat' })
      expect(canPurchaseProperty(player, 'utility')).toBe(false)
    })

    it('should allow party member to purchase elite properties', () => {
      const player = createTestPlayer({ rank: 'partyMember' })
      expect(canPurchaseProperty(player, 'elite')).toBe(true)
    })

    it('should prevent party member from purchasing Kremlin properties', () => {
      const player = createTestPlayer({ rank: 'partyMember' })
      expect(canPurchaseProperty(player, 'kremlin')).toBe(false)
    })

    it('should prevent party member from purchasing utilities', () => {
      const player = createTestPlayer({ rank: 'partyMember' })
      expect(canPurchaseProperty(player, 'utility')).toBe(false)
    })

    it('should allow commissar to purchase utilities', () => {
      const player = createTestPlayer({ rank: 'commissar' })
      expect(canPurchaseProperty(player, 'utility')).toBe(true)
    })

    it('should prevent commissar from purchasing Kremlin properties', () => {
      const player = createTestPlayer({ rank: 'commissar' })
      expect(canPurchaseProperty(player, 'kremlin')).toBe(false)
    })

    it('should allow inner circle to purchase all property types', () => {
      const player = createTestPlayer({ rank: 'innerCircle' })
      expect(canPurchaseProperty(player, 'siberian')).toBe(true)
      expect(canPurchaseProperty(player, 'collective')).toBe(true)
      expect(canPurchaseProperty(player, 'elite')).toBe(true)
      expect(canPurchaseProperty(player, 'kremlin')).toBe(true)
      expect(canPurchaseProperty(player, 'utility')).toBe(true)
    })

    it('should prevent tank piece from purchasing collective farm properties', () => {
      const player = createTestPlayer({ piece: 'tank', rank: 'innerCircle' })
      expect(canPurchaseProperty(player, 'collective')).toBe(false)
    })

    it('should allow tank piece to purchase non-collective properties', () => {
      const player = createTestPlayer({ piece: 'tank', rank: 'innerCircle' })
      expect(canPurchaseProperty(player, 'siberian')).toBe(true)
      expect(canPurchaseProperty(player, 'industrial')).toBe(true)
      expect(canPurchaseProperty(player, 'kremlin')).toBe(true)
    })
  })

  describe('getRankDiscount', () => {
    it('should return 0% discount for proletariat', () => {
      expect(getRankDiscount('proletariat')).toBe(0)
    })

    it('should return 10% discount for party member', () => {
      expect(getRankDiscount('partyMember')).toBe(0.1)
    })

    it('should return 20% discount for commissar', () => {
      expect(getRankDiscount('commissar')).toBe(0.2)
    })

    it('should return 50% discount for inner circle', () => {
      expect(getRankDiscount('innerCircle')).toBe(0.5)
    })
  })

  describe('calculateTotalWealth', () => {
    it('should calculate wealth as just rubles when player has no properties', () => {
      const player = createTestPlayer({ rubles: 1500, properties: [] })
      const properties: Property[] = []
      const wealth = calculateTotalWealth(player, properties)
      expect(wealth).toBe(1500)
    })

    it('should include base property values in wealth calculation', () => {
      const player = createTestPlayer({
        rubles: 1500,
        properties: ['1', '3'] // Siberian properties
      })
      const properties: Property[] = [
        createTestProperty(1, { custodianId: 'player-1' }), // Camp Vorkuta - 60 rubles
        createTestProperty(3, { custodianId: 'player-1' })  // Camp Kolyma - 60 rubles
      ]
      const wealth = calculateTotalWealth(player, properties)
      expect(wealth).toBe(1500 + 60 + 60) // 1620
    })

    it('should include collectivization value in wealth calculation', () => {
      const player = createTestPlayer({
        rubles: 1500,
        properties: ['1']
      })
      const properties: Property[] = [
        createTestProperty(1, { custodianId: 'player-1', collectivizationLevel: 3 }) // 60 base + 300 improvements
      ]
      const wealth = calculateTotalWealth(player, properties)
      expect(wealth).toBe(1500 + 60 + 300) // 1860
    })

    it('should handle multiple properties with different collectivization levels', () => {
      const player = createTestPlayer({
        rubles: 2000,
        properties: ['1', '3', '6']
      })
      const properties: Property[] = [
        createTestProperty(1, { custodianId: 'player-1', collectivizationLevel: 2 }), // 60 + 200
        createTestProperty(3, { custodianId: 'player-1', collectivizationLevel: 0 }), // 60 + 0
        createTestProperty(6, { custodianId: 'player-1', collectivizationLevel: 4 })  // 100 + 400
      ]
      const wealth = calculateTotalWealth(player, properties)
      expect(wealth).toBe(2000 + 60 + 200 + 60 + 0 + 100 + 400) // 2820
    })

    it('should ignore properties not owned by player', () => {
      const player = createTestPlayer({
        rubles: 1500,
        properties: ['1']
      })
      const properties: Property[] = [
        createTestProperty(1, { custodianId: 'player-1' }), // Owned
        createTestProperty(3, { custodianId: 'player-2' })  // Not owned
      ]
      const wealth = calculateTotalWealth(player, properties)
      expect(wealth).toBe(1500 + 60) // Only includes property 1
    })
  })

  describe('canImproveProperty', () => {
    it('should allow improvement when all conditions are met', () => {
      const properties: Property[] = [
        createTestProperty(1, { custodianId: 'player-1', collectivizationLevel: 0 }),
        createTestProperty(3, { custodianId: 'player-1', collectivizationLevel: 0 })
      ]
      const result = canImproveProperty(1, 'player-1', properties)
      expect(result.canImprove).toBe(true)
    })

    it('should prevent improvement when property not found', () => {
      const properties: Property[] = []
      const result = canImproveProperty(1, 'player-1', properties)
      expect(result.canImprove).toBe(false)
      expect(result.reason).toBe('Property not found')
    })

    it('should prevent improvement when not the custodian', () => {
      const properties: Property[] = [
        createTestProperty(1, { custodianId: 'player-2' })
      ]
      const result = canImproveProperty(1, 'player-1', properties)
      expect(result.canImprove).toBe(false)
      expect(result.reason).toBe('Not the custodian')
    })

    it('should prevent improvement when at maximum level', () => {
      const properties: Property[] = [
        createTestProperty(1, { custodianId: 'player-1', collectivizationLevel: 5 })
      ]
      const result = canImproveProperty(1, 'player-1', properties)
      expect(result.canImprove).toBe(false)
      expect(result.reason).toBe('Maximum level reached')
    })

    it('should prevent improvement when property is mortgaged', () => {
      const properties: Property[] = [
        createTestProperty(1, { custodianId: 'player-1', mortgaged: true })
      ]
      const result = canImproveProperty(1, 'player-1', properties)
      expect(result.canImprove).toBe(false)
      expect(result.reason).toBe('Property is mortgaged')
    })

    it('should require complete group ownership for level 4 to 5 upgrade', () => {
      const properties: Property[] = [
        createTestProperty(1, { custodianId: 'player-1', collectivizationLevel: 4 }), // Siberian
        createTestProperty(3, { custodianId: 'player-2', collectivizationLevel: 0 })  // Siberian - different owner
      ]
      const result = canImproveProperty(1, 'player-1', properties)
      expect(result.canImprove).toBe(false)
      expect(result.reason).toContain('Must own all properties in group')
    })

    it('should allow level 4 to 5 upgrade when complete group is owned', () => {
      const properties: Property[] = [
        createTestProperty(1, { custodianId: 'player-1', collectivizationLevel: 4 }), // Siberian
        createTestProperty(3, { custodianId: 'player-1', collectivizationLevel: 4 })  // Siberian - same owner
      ]
      const result = canImproveProperty(1, 'player-1', properties)
      expect(result.canImprove).toBe(true)
    })

    it('should enforce even building across color group', () => {
      const properties: Property[] = [
        createTestProperty(6, { custodianId: 'player-1', collectivizationLevel: 2 }), // Collective
        createTestProperty(8, { custodianId: 'player-1', collectivizationLevel: 0 }), // Collective - lower level
        createTestProperty(9, { custodianId: 'player-1', collectivizationLevel: 1 })  // Collective
      ]
      const result = canImproveProperty(6, 'player-1', properties)
      expect(result.canImprove).toBe(false)
      expect(result.reason).toContain('Must improve evenly')
    })

    it('should allow improvement when at same level as lowest in group', () => {
      const properties: Property[] = [
        createTestProperty(6, { custodianId: 'player-1', collectivizationLevel: 1 }), // Collective
        createTestProperty(8, { custodianId: 'player-1', collectivizationLevel: 1 }), // Collective - same level
        createTestProperty(9, { custodianId: 'player-1', collectivizationLevel: 2 })  // Collective - higher OK
      ]
      const result = canImproveProperty(6, 'player-1', properties)
      expect(result.canImprove).toBe(true)
    })
  })

  describe('getRailwayCount', () => {
    it('should return 0 when player owns no railways', () => {
      const properties: Property[] = [
        createTestProperty(5, { custodianId: 'player-2' }),  // Moscow Station
        createTestProperty(15, { custodianId: 'player-2' }), // Leningrad Station
        createTestProperty(25, { custodianId: 'player-2' }), // Kiev Station
        createTestProperty(35, { custodianId: 'player-2' })  // Siberian Station
      ]
      const count = getRailwayCount('player-1', properties)
      expect(count).toBe(0)
    })

    it('should return 1 when player owns one railway', () => {
      const properties: Property[] = [
        createTestProperty(5, { custodianId: 'player-1' }),  // Moscow Station
        createTestProperty(15, { custodianId: 'player-2' }), // Leningrad Station
        createTestProperty(25, { custodianId: 'player-2' }), // Kiev Station
        createTestProperty(35, { custodianId: 'player-2' })  // Siberian Station
      ]
      const count = getRailwayCount('player-1', properties)
      expect(count).toBe(1)
    })

    it('should return 4 when player owns all railways', () => {
      const properties: Property[] = [
        createTestProperty(5, { custodianId: 'player-1' }),  // Moscow Station
        createTestProperty(15, { custodianId: 'player-1' }), // Leningrad Station
        createTestProperty(25, { custodianId: 'player-1' }), // Kiev Station
        createTestProperty(35, { custodianId: 'player-1' })  // Siberian Station
      ]
      const count = getRailwayCount('player-1', properties)
      expect(count).toBe(4)
    })

    it('should handle partial railway ownership', () => {
      const properties: Property[] = [
        createTestProperty(5, { custodianId: 'player-1' }),  // Moscow Station
        createTestProperty(15, { custodianId: 'player-1' }), // Leningrad Station
        createTestProperty(25, { custodianId: 'player-2' }), // Kiev Station
        createTestProperty(35, { custodianId: null })        // Siberian Station - unowned
      ]
      const count = getRailwayCount('player-1', properties)
      expect(count).toBe(2)
    })
  })

  describe('getUtilityCount', () => {
    it('should return 0 when player owns no utilities', () => {
      const properties: Property[] = [
        createTestProperty(12, { custodianId: 'player-2' }), // Pravda Press
        createTestProperty(28, { custodianId: 'player-2' })  // Radio Moscow
      ]
      const count = getUtilityCount('player-1', properties)
      expect(count).toBe(0)
    })

    it('should return 1 when player owns one utility', () => {
      const properties: Property[] = [
        createTestProperty(12, { custodianId: 'player-1' }), // Pravda Press
        createTestProperty(28, { custodianId: 'player-2' })  // Radio Moscow
      ]
      const count = getUtilityCount('player-1', properties)
      expect(count).toBe(1)
    })

    it('should return 2 when player owns both utilities', () => {
      const properties: Property[] = [
        createTestProperty(12, { custodianId: 'player-1' }), // Pravda Press
        createTestProperty(28, { custodianId: 'player-1' })  // Radio Moscow
      ]
      const count = getUtilityCount('player-1', properties)
      expect(count).toBe(2)
    })

    it('should handle unowned utilities', () => {
      const properties: Property[] = [
        createTestProperty(12, { custodianId: 'player-1' }), // Pravda Press
        createTestProperty(28, { custodianId: null })        // Radio Moscow - unowned
      ]
      const count = getUtilityCount('player-1', properties)
      expect(count).toBe(1)
    })
  })

  describe('calculateRailwayFee - edge cases', () => {
    it('should return 0 when player owns no railways', () => {
      const properties: Property[] = [
        createTestProperty(5, { custodianId: 'player-2' })
      ]
      const fee = calculateRailwayFee('player-1', properties)
      expect(fee).toBe(0)
    })

    it('should return correct fee progression for 1-4 railways', () => {
      // 1 railway
      let properties: Property[] = [
        createTestProperty(5, { custodianId: 'player-1' })
      ]
      expect(calculateRailwayFee('player-1', properties)).toBe(50)

      // 2 railways
      properties = [
        createTestProperty(5, { custodianId: 'player-1' }),
        createTestProperty(15, { custodianId: 'player-1' })
      ]
      expect(calculateRailwayFee('player-1', properties)).toBe(100)

      // 3 railways
      properties = [
        createTestProperty(5, { custodianId: 'player-1' }),
        createTestProperty(15, { custodianId: 'player-1' }),
        createTestProperty(25, { custodianId: 'player-1' })
      ]
      expect(calculateRailwayFee('player-1', properties)).toBe(150)

      // 4 railways
      properties = [
        createTestProperty(5, { custodianId: 'player-1' }),
        createTestProperty(15, { custodianId: 'player-1' }),
        createTestProperty(25, { custodianId: 'player-1' }),
        createTestProperty(35, { custodianId: 'player-1' })
      ]
      expect(calculateRailwayFee('player-1', properties)).toBe(200)
    })
  })

  describe('calculateQuota - edge cases', () => {
    it('should return 0 for properties with no base quota', () => {
      const property = createTestProperty(0, { custodianId: 'player-1' }) // GO space
      const properties: Property[] = [property]
      const quota = calculateQuota(property, properties)
      expect(quota).toBe(0)
    })

    it('should double quota for complete group ownership without collectivization', () => {
      const properties: Property[] = [
        createTestProperty(1, { custodianId: 'player-1', collectivizationLevel: 0 }), // Siberian
        createTestProperty(3, { custodianId: 'player-1', collectivizationLevel: 0 })  // Siberian
      ]
      const quota = calculateQuota(properties[0], properties)
      expect(quota).toBe(4) // Base 2 * 2 for complete group
    })

    it('should apply collectivization multiplier instead of group bonus', () => {
      const properties: Property[] = [
        createTestProperty(1, { custodianId: 'player-1', collectivizationLevel: 1 }), // Siberian with level 1
        createTestProperty(3, { custodianId: 'player-1', collectivizationLevel: 0 })  // Siberian
      ]
      const quota = calculateQuota(properties[0], properties)
      expect(quota).toBe(8) // Base 2 * 4 (level 1 multiplier), NOT doubled for group
    })

    it('should apply sickle ability on collective farm properties', () => {
      const player = createTestPlayer({ piece: 'sickle' })
      const properties: Property[] = [
        createTestProperty(6, { custodianId: 'player-2' }) // Collective Farm
      ]
      const quota = calculateQuota(properties[0], properties, player)
      expect(quota).toBe(3) // Base 6 * 0.5 for sickle ability
    })

    it('should double quota for proletariat on elite properties', () => {
      const player = createTestPlayer({ rank: 'proletariat' })
      const properties: Property[] = [
        createTestProperty(31, { custodianId: 'player-2' }) // Politburo Apartments (elite)
      ]
      const quota = calculateQuota(properties[0], properties, player)
      expect(quota).toBe(52) // Base 26 * 2 for proletariat on elite
    })

    it('should not double quota for party member on elite properties', () => {
      const player = createTestPlayer({ rank: 'partyMember' })
      const properties: Property[] = [
        createTestProperty(31, { custodianId: 'player-2' }) // Politburo Apartments (elite)
      ]
      const quota = calculateQuota(properties[0], properties, player)
      expect(quota).toBe(26) // Base 26, no doubling for party member
    })

    it('should floor quota to integer', () => {
      const player = createTestPlayer({ piece: 'sickle' })
      const properties: Property[] = [
        createTestProperty(6, { custodianId: 'player-2' }) // Collective Farm, base quota 6
      ]
      const quota = calculateQuota(properties[0], properties, player)
      expect(quota).toBe(3) // 6 * 0.5 = 3.0, floored to 3
    })
  })
})
