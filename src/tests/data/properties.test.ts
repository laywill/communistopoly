// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { describe, it, expect } from 'vitest'
import {
  getCollectivizationMultiplier,
  getCollectivizationName,
  getNextCollectivizationCost,
  COLLECTIVIZATION_LEVELS
} from '../../data/properties'

describe('Collectivization Helpers', () => {
  describe('getCollectivizationMultiplier', () => {
    it('should return correct multipliers for valid levels (0-5)', () => {
      expect(getCollectivizationMultiplier(0)).toBe(1.0)
      expect(getCollectivizationMultiplier(1)).toBe(4.0)
      expect(getCollectivizationMultiplier(2)).toBe(9.0)
      expect(getCollectivizationMultiplier(3)).toBe(15.0)
      expect(getCollectivizationMultiplier(4)).toBe(20.0)
      expect(getCollectivizationMultiplier(5)).toBe(30.0)
    })

    it('should return default multiplier (1.0) for invalid negative level', () => {
      expect(getCollectivizationMultiplier(-1)).toBe(1.0)
      expect(getCollectivizationMultiplier(-5)).toBe(1.0)
    })

    it('should return default multiplier (1.0) for level above maximum', () => {
      expect(getCollectivizationMultiplier(6)).toBe(1.0)
      expect(getCollectivizationMultiplier(10)).toBe(1.0)
      expect(getCollectivizationMultiplier(999)).toBe(1.0)
    })
  })

  describe('getCollectivizationName', () => {
    it('should return correct names for valid levels (0-5)', () => {
      expect(getCollectivizationName(0)).toBe('None')
      expect(getCollectivizationName(1)).toBe("Worker's Committee")
      expect(getCollectivizationName(2)).toBe('Party Oversight')
      expect(getCollectivizationName(3)).toBe('Full Collectivization')
      expect(getCollectivizationName(4)).toBe('Model Soviet')
      expect(getCollectivizationName(5)).toBe("People's Palace")
    })

    it('should return default name ("None") for invalid negative level', () => {
      expect(getCollectivizationName(-1)).toBe('None')
      expect(getCollectivizationName(-10)).toBe('None')
    })

    it('should return default name ("None") for level above maximum', () => {
      expect(getCollectivizationName(6)).toBe('None')
      expect(getCollectivizationName(100)).toBe('None')
    })
  })

  describe('getNextCollectivizationCost', () => {
    it('should return correct costs for valid levels (0-4)', () => {
      expect(getNextCollectivizationCost(0)).toBe(100)
      expect(getNextCollectivizationCost(1)).toBe(100)
      expect(getNextCollectivizationCost(2)).toBe(100)
      expect(getNextCollectivizationCost(3)).toBe(100)
      expect(getNextCollectivizationCost(4)).toBe(200)
    })

    it('should return 0 for maximum level (5) as there is no next level', () => {
      expect(getNextCollectivizationCost(5)).toBe(0)
    })

    it('should return 0 for levels above maximum', () => {
      expect(getNextCollectivizationCost(6)).toBe(0)
      expect(getNextCollectivizationCost(10)).toBe(0)
      expect(getNextCollectivizationCost(999)).toBe(0)
    })

    it('should return 0 for invalid negative levels', () => {
      expect(getNextCollectivizationCost(-1)).toBe(0)
      expect(getNextCollectivizationCost(-5)).toBe(0)
    })
  })

  describe('COLLECTIVIZATION_LEVELS data integrity', () => {
    it('should have 6 levels (0-5)', () => {
      expect(COLLECTIVIZATION_LEVELS).toHaveLength(6)
    })

    it('should have levels in ascending order', () => {
      for (let i = 0; i < COLLECTIVIZATION_LEVELS.length; i++) {
        expect(COLLECTIVIZATION_LEVELS[i].level).toBe(i)
      }
    })

    it('should have multipliers in ascending order', () => {
      for (let i = 1; i < COLLECTIVIZATION_LEVELS.length; i++) {
        expect(COLLECTIVIZATION_LEVELS[i].multiplier).toBeGreaterThan(
          COLLECTIVIZATION_LEVELS[i - 1].multiplier
        )
      }
    })
  })
})
