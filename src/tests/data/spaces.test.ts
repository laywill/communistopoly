// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { describe, it, expect } from 'vitest'
import {
  BOARD_SPACES,
  getSpacesByType,
  getSpacesByGroup,
  getPropertiesByGroup
} from '../../data/spaces'
import type { SpaceType, PropertyGroup } from '../../types/game'

describe('Spaces Filter Functions', () => {
  describe('getSpacesByType', () => {
    it('should return all property spaces', () => {
      const properties = getSpacesByType('property')
      expect(properties.length).toBeGreaterThan(0)
      expect(properties.every(space => space.type === 'property')).toBe(true)
    })

    it('should return all corner spaces', () => {
      const corners = getSpacesByType('corner')
      expect(corners.length).toBeGreaterThan(0)
      expect(corners.every(space => space.type === 'corner')).toBe(true)
    })

    it('should return all card spaces', () => {
      const cards = getSpacesByType('card')
      expect(cards.length).toBeGreaterThan(0)
      expect(cards.every(space => space.type === 'card')).toBe(true)
    })

    it('should return empty array for non-existent type', () => {
      const result = getSpacesByType('nonexistent' as unknown as SpaceType)
      expect(result).toEqual([])
    })
  })

  describe('getSpacesByGroup', () => {
    it('should return all spaces in siberian group', () => {
      const siberianSpaces = getSpacesByGroup('siberian')
      expect(siberianSpaces.length).toBeGreaterThan(0)
      expect(siberianSpaces.every(space => space.group === 'siberian')).toBe(true)
    })

    it('should return all spaces in railroad group', () => {
      const railroads = getSpacesByGroup('railroad')
      expect(railroads.length).toBeGreaterThan(0)
      expect(railroads.every(space => space.group === 'railroad')).toBe(true)
    })

    it('should return all spaces in utility group', () => {
      const utilities = getSpacesByGroup('utility')
      expect(utilities.length).toBeGreaterThan(0)
      expect(utilities.every(space => space.group === 'utility')).toBe(true)
    })

    it('should return empty array for non-existent group', () => {
      const result = getSpacesByGroup('nonexistent' as unknown as PropertyGroup)
      expect(result).toEqual([])
    })
  })

  describe('getPropertiesByGroup', () => {
    it('should return only property type spaces for siberian group', () => {
      const properties = getPropertiesByGroup('siberian')
      expect(properties.length).toBeGreaterThan(0)
      expect(properties.every(space => space.type === 'property')).toBe(true)
      expect(properties.every(space => space.group === 'siberian')).toBe(true)
    })

    it('should filter out non-property spaces even if they have the group', () => {
      // Railroad spaces have group='railroad' but type='railway', not 'property'
      const railroadProperties = getPropertiesByGroup('railroad')
      expect(railroadProperties).toEqual([])
    })

    it('should filter out utility spaces even if they have the group', () => {
      // Utility spaces have group='utility' but type='utility', not 'property'
      const utilityProperties = getPropertiesByGroup('utility')
      expect(utilityProperties).toEqual([])
    })

    it('should return empty array for non-existent group', () => {
      const result = getPropertiesByGroup('nonexistent')
      expect(result).toEqual([])
    })

    it('should return properties for all property groups', () => {
      // Test that we can get properties from multiple groups
      const propertyGroups = Array.from(
        new Set(
          BOARD_SPACES
            .filter(space => space.type === 'property')
            .map(space => space.group)
            .filter((group): group is string => group !== undefined)
        )
      )

      expect(propertyGroups.length).toBeGreaterThan(0)

      propertyGroups.forEach(group => {
        const properties = getPropertiesByGroup(group)
        expect(properties.length).toBeGreaterThan(0)
        expect(properties.every(space => space.type === 'property')).toBe(true)
        expect(properties.every(space => space.group === group)).toBe(true)
      })
    })
  })
})
