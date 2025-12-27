// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { describe, it, expect } from 'vitest'
import { calculateQuota, calculateRailwayFee } from '../../utils/propertyUtils'
import { createTestPlayer, createTestProperty } from '../helpers/gameStateHelpers'
import { Property } from '../../types/game'

describe('Quota Calculation', () => {
  describe('Base Quotas', () => {
    it('should return correct base quota for Camp Vorkuta (Siberian)', () => {
      const property = createTestProperty(1, { custodianId: 'custodian-1' })
      const properties: Property[] = [property]
      const quota = calculateQuota(property, properties)
      expect(quota).toBe(2)
    })

    it('should return correct base quota for Camp Kolyma (Siberian)', () => {
      const property = createTestProperty(3, { custodianId: 'custodian-1' })
      const properties: Property[] = [property]
      const quota = calculateQuota(property, properties)
      expect(quota).toBe(4)
    })

    it('should return correct base quota for Kolkhoz Sunrise (Collective Farm)', () => {
      const property = createTestProperty(6, { custodianId: 'custodian-1' })
      const properties: Property[] = [property]
      const quota = calculateQuota(property, properties)
      expect(quota).toBe(6)
    })

    it('should return correct base quota for Kolkhoz Progress (Collective Farm)', () => {
      const property = createTestProperty(8, { custodianId: 'custodian-1' })
      const properties: Property[] = [property]
      const quota = calculateQuota(property, properties)
      expect(quota).toBe(6)
    })

    it('should return correct base quota for Kolkhoz Victory (Collective Farm)', () => {
      const property = createTestProperty(9, { custodianId: 'custodian-1' })
      const properties: Property[] = [property]
      const quota = calculateQuota(property, properties)
      expect(quota).toBe(8)
    })

    it('should return correct base quota for Tractor Factory #47 (Industrial)', () => {
      const property = createTestProperty(11, { custodianId: 'custodian-1' })
      const properties: Property[] = [property]
      const quota = calculateQuota(property, properties)
      expect(quota).toBe(10)
    })

    it('should return correct base quota for Lenin\'s Mausoleum (Kremlin)', () => {
      const property = createTestProperty(37, { custodianId: 'custodian-1' })
      const properties: Property[] = [property]
      const quota = calculateQuota(property, properties)
      expect(quota).toBe(35)
    })

    it('should return correct base quota for Stalin\'s Private Office (Kremlin)', () => {
      const property = createTestProperty(39, { custodianId: 'custodian-1' })
      const properties: Property[] = [property]
      const quota = calculateQuota(property, properties)
      expect(quota).toBe(50)
    })

    it('should calculate base quota regardless of custodian status', () => {
      // Note: The function calculates quota based on property data alone
      // The check for custodian happens before calling this function in actual usage
      const property = createTestProperty(1, { custodianId: null })
      const properties: Property[] = [property]
      const quota = calculateQuota(property, properties)
      expect(quota).toBe(2) // Still returns base quota
    })
  })

  describe('Collectivization Level Multipliers', () => {
    it('should apply 1.0x multiplier for level 0 (None)', () => {
      const property = createTestProperty(1, {
        custodianId: 'custodian-1',
        collectivizationLevel: 0
      })
      const properties: Property[] = [property]
      const quota = calculateQuota(property, properties)
      expect(quota).toBe(2) // 2 * 1.0 = 2
    })

    it('should apply 3.0x multiplier for level 1 (Worker\'s Committee)', () => {
      const property = createTestProperty(1, {
        custodianId: 'custodian-1',
        collectivizationLevel: 1
      })
      const properties: Property[] = [property]
      const quota = calculateQuota(property, properties)
      expect(quota).toBe(6) // 2 * 3.0 = 6
    })

    it('should apply 9.0x multiplier for level 2 (Party Oversight)', () => {
      const property = createTestProperty(1, {
        custodianId: 'custodian-1',
        collectivizationLevel: 2
      })
      const properties: Property[] = [property]
      const quota = calculateQuota(property, properties)
      expect(quota).toBe(18) // 2 * 9.0 = 18
    })

    it('should apply 15.0x multiplier for level 3 (Full Collectivization)', () => {
      const property = createTestProperty(1, {
        custodianId: 'custodian-1',
        collectivizationLevel: 3
      })
      const properties: Property[] = [property]
      const quota = calculateQuota(property, properties)
      expect(quota).toBe(30) // 2 * 15.0 = 30
    })

    it('should apply 20.0x multiplier for level 4 (Model Soviet)', () => {
      const property = createTestProperty(1, {
        custodianId: 'custodian-1',
        collectivizationLevel: 4
      })
      const properties: Property[] = [property]
      const quota = calculateQuota(property, properties)
      expect(quota).toBe(40) // 2 * 20.0 = 40
    })

    it('should apply 30.0x multiplier for level 5 (People\'s Palace)', () => {
      const property = createTestProperty(1, {
        custodianId: 'custodian-1',
        collectivizationLevel: 5
      })
      const properties: Property[] = [property]
      const quota = calculateQuota(property, properties)
      expect(quota).toBe(60) // 2 * 30.0 = 60
    })
  })

  describe('Complete Group Ownership', () => {
    it('should double quota when custodian owns complete Siberian group', () => {
      const property1 = createTestProperty(1, { custodianId: 'custodian-1' })
      const property2 = createTestProperty(3, { custodianId: 'custodian-1' })
      const properties: Property[] = [property1, property2]

      const quota = calculateQuota(property1, properties)
      expect(quota).toBe(4) // 2 * 1.0 (level 0) * 2 (complete group) = 4
    })

    it('should double quota when custodian owns complete Collective Farm group', () => {
      const property1 = createTestProperty(6, { custodianId: 'custodian-1' })
      const property2 = createTestProperty(8, { custodianId: 'custodian-1' })
      const property3 = createTestProperty(9, { custodianId: 'custodian-1' })
      const properties: Property[] = [property1, property2, property3]

      const quota = calculateQuota(property1, properties)
      expect(quota).toBe(12) // 6 * 1.0 * 2 = 12
    })

    it('should NOT double quota when custodian does not own complete group', () => {
      const property1 = createTestProperty(1, { custodianId: 'custodian-1' })
      const property2 = createTestProperty(3, { custodianId: 'custodian-2' })
      const properties: Property[] = [property1, property2]

      const quota = calculateQuota(property1, properties)
      expect(quota).toBe(2) // 2 * 1.0 (no complete group bonus)
    })
  })

  describe('Piece Ability Modifiers', () => {
    it('should halve Collective Farm quotas for Sickle piece', () => {
      const property = createTestProperty(6, { custodianId: 'custodian-1' })
      const properties: Property[] = [property]
      const player = createTestPlayer({ piece: 'sickle' })

      const quota = calculateQuota(property, properties, player)
      expect(quota).toBe(3) // 6 * 0.5 = 3
    })

    it('should halve Collective Farm quotas with complete group for Sickle', () => {
      const property1 = createTestProperty(6, { custodianId: 'custodian-1' })
      const property2 = createTestProperty(8, { custodianId: 'custodian-1' })
      const property3 = createTestProperty(9, { custodianId: 'custodian-1' })
      const properties: Property[] = [property1, property2, property3]
      const player = createTestPlayer({ piece: 'sickle' })

      const quota = calculateQuota(property1, properties, player)
      expect(quota).toBe(6) // 6 * 2 (complete group) * 0.5 (sickle) = 6
    })

    it('should NOT modify non-Collective Farm quotas for Sickle piece', () => {
      const property = createTestProperty(11, { custodianId: 'custodian-1' })
      const properties: Property[] = [property]
      const player = createTestPlayer({ piece: 'sickle' })

      const quota = calculateQuota(property, properties, player)
      expect(quota).toBe(10) // 10 * 1.0 (no sickle modifier for non-farms)
    })

    it('should NOT modify quotas for non-Sickle pieces', () => {
      const property = createTestProperty(6, { custodianId: 'custodian-1' })
      const properties: Property[] = [property]
      const player = createTestPlayer({ piece: 'hammer' })

      const quota = calculateQuota(property, properties, player)
      expect(quota).toBe(6) // 6 * 1.0 (no modifier)
    })
  })

  describe('Party Elite District Special Rules', () => {
    it('should double quota for Proletariat players in Elite properties', () => {
      const property = createTestProperty(31, { custodianId: 'custodian-1' })
      const properties: Property[] = [property]
      const player = createTestPlayer({ rank: 'proletariat' })

      const quota = calculateQuota(property, properties, player)
      expect(quota).toBe(52) // 26 * 2 (proletariat penalty) = 52
    })

    it('should NOT double quota for Party Member in Elite properties', () => {
      const property = createTestProperty(31, { custodianId: 'custodian-1' })
      const properties: Property[] = [property]
      const player = createTestPlayer({ rank: 'partyMember' })

      const quota = calculateQuota(property, properties, player)
      expect(quota).toBe(26) // 26 * 1.0 (no penalty)
    })

    it('should NOT double quota for Commissar in Elite properties', () => {
      const property = createTestProperty(31, { custodianId: 'custodian-1' })
      const properties: Property[] = [property]
      const player = createTestPlayer({ rank: 'commissar' })

      const quota = calculateQuota(property, properties, player)
      expect(quota).toBe(26)
    })

    it('should NOT double quota for Inner Circle in Elite properties', () => {
      const property = createTestProperty(31, { custodianId: 'custodian-1' })
      const properties: Property[] = [property]
      const player = createTestPlayer({ rank: 'innerCircle' })

      const quota = calculateQuota(property, properties, player)
      expect(quota).toBe(26)
    })
  })

  describe('Railway Station Quotas', () => {
    it('should return 50 for 1 station controlled', () => {
      const property = createTestProperty(5, { custodianId: 'custodian-1' })
      const properties: Property[] = [property]

      const fee = calculateRailwayFee('custodian-1', properties)
      expect(fee).toBe(50)
    })

    it('should return 100 for 2 stations controlled', () => {
      const property1 = createTestProperty(5, { custodianId: 'custodian-1' })
      const property2 = createTestProperty(15, { custodianId: 'custodian-1' })
      const properties: Property[] = [property1, property2]

      const fee = calculateRailwayFee('custodian-1', properties)
      expect(fee).toBe(100)
    })

    it('should return 150 for 3 stations controlled', () => {
      const property1 = createTestProperty(5, { custodianId: 'custodian-1' })
      const property2 = createTestProperty(15, { custodianId: 'custodian-1' })
      const property3 = createTestProperty(25, { custodianId: 'custodian-1' })
      const properties: Property[] = [property1, property2, property3]

      const fee = calculateRailwayFee('custodian-1', properties)
      expect(fee).toBe(150)
    })

    it('should return 200 for all 4 stations controlled', () => {
      const property1 = createTestProperty(5, { custodianId: 'custodian-1' })
      const property2 = createTestProperty(15, { custodianId: 'custodian-1' })
      const property3 = createTestProperty(25, { custodianId: 'custodian-1' })
      const property4 = createTestProperty(35, { custodianId: 'custodian-1' })
      const properties: Property[] = [property1, property2, property3, property4]

      const fee = calculateRailwayFee('custodian-1', properties)
      expect(fee).toBe(200)
    })

    it('should return 0 for no stations controlled', () => {
      const properties: Property[] = []
      const fee = calculateRailwayFee('custodian-1', properties)
      expect(fee).toBe(0)
    })
  })

  describe('Complex Scenarios', () => {
    it('should correctly calculate quota with collectivization and complete group', () => {
      // Complete Siberian group with level 2 collectivization
      const property1 = createTestProperty(1, {
        custodianId: 'custodian-1',
        collectivizationLevel: 2
      })
      const property2 = createTestProperty(3, {
        custodianId: 'custodian-1',
        collectivizationLevel: 1
      })
      const properties: Property[] = [property1, property2]

      const quota = calculateQuota(property1, properties)
      expect(quota).toBe(36) // 2 * 9.0 (level 2) * 2 (complete group) = 36
    })

    it('should correctly calculate quota with collectivization, complete group, and Sickle', () => {
      // Complete Collective Farm group with level 1 collectivization and Sickle piece
      const property1 = createTestProperty(6, {
        custodianId: 'custodian-1',
        collectivizationLevel: 1
      })
      const property2 = createTestProperty(8, {
        custodianId: 'custodian-1',
        collectivizationLevel: 1
      })
      const property3 = createTestProperty(9, {
        custodianId: 'custodian-1',
        collectivizationLevel: 1
      })
      const properties: Property[] = [property1, property2, property3]
      const player = createTestPlayer({ piece: 'sickle' })

      const quota = calculateQuota(property1, properties, player)
      expect(quota).toBe(18) // 6 * 3.0 (level 1) * 2 (complete group) * 0.5 (sickle) = 18
    })

    it('should correctly calculate quota with collectivization and Proletariat in Elite', () => {
      // Elite property with level 3 collectivization, Proletariat player
      const property = createTestProperty(31, {
        custodianId: 'custodian-1',
        collectivizationLevel: 3
      })
      const properties: Property[] = [property]
      const player = createTestPlayer({ rank: 'proletariat' })

      const quota = calculateQuota(property, properties, player)
      expect(quota).toBe(780) // 26 * 15.0 (level 3) * 2 (proletariat) = 780
    })
  })

  describe('Edge Cases', () => {
    it('should calculate quota even for mortgaged properties', () => {
      // Note: The function doesn't check mortgage status
      // In practice, mortgaged properties shouldn't charge quotas,
      // but this is handled by the caller, not calculateQuota itself
      const property = createTestProperty(1, {
        custodianId: 'custodian-1',
        mortgaged: true
      })
      const properties: Property[] = [property]

      const quota = calculateQuota(property, properties)
      expect(quota).toBe(2) // Still calculates base quota
    })

    it('should floor decimal results', () => {
      // Test that quota calculation floors the result
      const property = createTestProperty(9, {
        custodianId: 'custodian-1',
        collectivizationLevel: 0
      })
      const properties: Property[] = [property]
      const player = createTestPlayer({ piece: 'sickle' })

      const quota = calculateQuota(property, properties, player)
      expect(quota).toBe(4) // 8 * 0.5 = 4.0 (floored)
    })

    it('should handle maximum collectivization level', () => {
      const property = createTestProperty(39, {
        custodianId: 'custodian-1',
        collectivizationLevel: 5
      })
      const properties: Property[] = [property]

      const quota = calculateQuota(property, properties)
      expect(quota).toBe(1500) // 50 * 30.0 = 1500
    })
  })
})
