// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { describe, it, expect } from 'vitest'
import {
  createMultiplePlayersWithPieces,
  getRankOrder,
  getRankLevel,
  getLowerRank,
  getHigherRank
} from './pieceHelpers'

describe('pieceHelpers - createMultiplePlayersWithPieces', () => {
  it('should create multiple players with different pieces', () => {
    const players = createMultiplePlayersWithPieces(['hammer', 'sickle', 'tank'])

    expect(players).toHaveLength(3)

    // Verify each player has correct piece
    expect(players[0].piece).toBe('hammer')
    expect(players[1].piece).toBe('sickle')
    expect(players[2].piece).toBe('tank')

    // Verify auto-generated IDs and names
    expect(players[0].id).toBe('test-player-1')
    expect(players[0].name).toBe('Player 1')
    expect(players[1].id).toBe('test-player-2')
    expect(players[1].name).toBe('Player 2')
    expect(players[2].id).toBe('test-player-3')
    expect(players[2].name).toBe('Player 3')
  })

  it('should apply overrides to specific players', () => {
    const players = createMultiplePlayersWithPieces(
      ['hammer', 'sickle'],
      [
        { rubles: 2000, rank: 'commissar' },
        { rubles: 500, rank: 'partyMember' }
      ]
    )

    expect(players).toHaveLength(2)

    // Verify overrides were applied
    expect(players[0].rubles).toBe(2000)
    expect(players[0].rank).toBe('commissar')
    expect(players[1].rubles).toBe(500)
    expect(players[1].rank).toBe('partyMember')
  })

  it('should handle piece-specific defaults with overrides', () => {
    const players = createMultiplePlayersWithPieces(
      ['redStar', 'tank', 'sickle'],
      [
        {},
        { rubles: 3000 },
        { rank: 'innerCircle' }
      ]
    )

    // Red Star should start at partyMember rank (piece default)
    expect(players[0].rank).toBe('partyMember')

    // Tank should have override rubles but keep other defaults
    expect(players[1].rubles).toBe(3000)
    expect(players[1].hasUsedTankGulagImmunity).toBe(false)

    // Sickle should have custom rank override
    expect(players[2].rank).toBe('innerCircle')
    expect(players[2].hasUsedSickleHarvest).toBe(false)
  })

  it('should work with empty overrides array', () => {
    const players = createMultiplePlayersWithPieces(['hammer', 'sickle'])

    expect(players).toHaveLength(2)
    expect(players[0].piece).toBe('hammer')
    expect(players[1].piece).toBe('sickle')
  })
})

describe('pieceHelpers - rank helpers', () => {
  describe('getRankOrder', () => {
    it('should return correct rank order array', () => {
      const ranks = getRankOrder()

      expect(ranks).toEqual(['proletariat', 'partyMember', 'commissar', 'innerCircle'])
      expect(ranks).toHaveLength(4)
    })
  })

  describe('getRankLevel', () => {
    it('should return correct level for proletariat', () => {
      expect(getRankLevel('proletariat')).toBe(0)
    })

    it('should return correct level for partyMember', () => {
      expect(getRankLevel('partyMember')).toBe(1)
    })

    it('should return correct level for commissar', () => {
      expect(getRankLevel('commissar')).toBe(2)
    })

    it('should return correct level for innerCircle', () => {
      expect(getRankLevel('innerCircle')).toBe(3)
    })
  })

  describe('getLowerRank', () => {
    it('should return null for proletariat (lowest rank)', () => {
      expect(getLowerRank('proletariat')).toBeNull()
    })

    it('should return proletariat for partyMember', () => {
      expect(getLowerRank('partyMember')).toBe('proletariat')
    })

    it('should return partyMember for commissar', () => {
      expect(getLowerRank('commissar')).toBe('partyMember')
    })

    it('should return commissar for innerCircle', () => {
      expect(getLowerRank('innerCircle')).toBe('commissar')
    })
  })

  describe('getHigherRank', () => {
    it('should return partyMember for proletariat', () => {
      expect(getHigherRank('proletariat')).toBe('partyMember')
    })

    it('should return commissar for partyMember', () => {
      expect(getHigherRank('partyMember')).toBe('commissar')
    })

    it('should return innerCircle for commissar', () => {
      expect(getHigherRank('commissar')).toBe('innerCircle')
    })

    it('should return null for innerCircle (highest rank)', () => {
      expect(getHigherRank('innerCircle')).toBeNull()
    })
  })
})
