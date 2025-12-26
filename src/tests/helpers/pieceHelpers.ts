// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { Player, PieceType, PartyRank } from '../../types/game'
import { createTestPlayer } from './gameStateHelpers'

/**
 * Creates a test player with a specific piece and default piece-specific state
 */
export function createPlayerWithPiece(piece: PieceType, overrides: Partial<Player> = {}): Player {
  return createTestPlayer({
    piece,
    ...getDefaultPieceState(piece),
    ...overrides
  })
}

/**
 * Gets default state values for each piece type
 */
function getDefaultPieceState(piece: PieceType): Partial<Player> {
  switch (piece) {
    case 'redStar':
      // Red Star starts at Party Member rank
      return { rank: 'partyMember' }

    case 'tank':
      return {
        hasUsedTankGulagImmunity: false,
        tankRequisitionUsedThisLap: false,
        lapsCompleted: 0
      }

    case 'breadLoaf':
      // Start with enough money to not be starving
      return { rubles: 500 }

    case 'sickle':
      return {
        hasUsedSickleHarvest: false,
        sickleMotherlandForgotten: false
      }

    case 'ironCurtain':
      return {
        hasUsedIronCurtainDisappear: false,
        ironCurtainClaimedRubles: 0
      }

    case 'vodkaBottle':
      return { vodkaUseCount: 0 }

    case 'statueOfLenin':
      return { hasUsedLeninSpeech: false }

    case 'hammer':
      return {} // No special defaults

    default:
      return {}
  }
}

/**
 * Creates multiple test players with different pieces
 */
export function createMultiplePlayersWithPieces(
  pieces: PieceType[],
  overrides: Partial<Player>[] = []
): Player[] {
  return pieces.map((piece, index) => {
    const basePlayer = createPlayerWithPiece(piece, overrides[index] || {})
    return {
      ...basePlayer,
      id: `test-player-${index + 1}`,
      name: `Player ${index + 1}`
    }
  })
}

/**
 * Helper to get rank order (for rank comparison tests)
 */
export function getRankOrder(): PartyRank[] {
  return ['proletariat', 'partyMember', 'commissar', 'innerCircle']
}

/**
 * Helper to get rank level (higher number = higher rank)
 */
export function getRankLevel(rank: PartyRank): number {
  return getRankOrder().indexOf(rank)
}

/**
 * Helper to get next lower rank (returns null if already at lowest)
 */
export function getLowerRank(rank: PartyRank): PartyRank | null {
  const ranks = getRankOrder()
  const currentIndex = ranks.indexOf(rank)
  return currentIndex > 0 ? ranks[currentIndex - 1] : null
}

/**
 * Helper to get next higher rank (returns null if already at highest)
 */
export function getHigherRank(rank: PartyRank): PartyRank | null {
  const ranks = getRankOrder()
  const currentIndex = ranks.indexOf(rank)
  return currentIndex < ranks.length - 1 ? ranks[currentIndex + 1] : null
}
