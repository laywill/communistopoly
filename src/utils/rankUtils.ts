// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { PartyRank } from '../types/game'

/**
 * Ordered rank hierarchy (index = level, higher index = higher rank)
 */
export const RANK_HIERARCHY: readonly PartyRank[] = ['proletariat', 'partyMember', 'commissar', 'innerCircle'] as const

/**
 * Get rank hierarchy level (higher number = higher rank)
 * @returns 0 for proletariat, 1 for partyMember, 2 for commissar, 3 for innerCircle, -1 for unknown
 */
export function getRankLevel (rank: PartyRank): number {
  return RANK_HIERARCHY.indexOf(rank)
}

/**
 * Demote a player to the next lower rank
 * @returns The new rank after demotion, or the same rank if already at lowest
 */
export function demoteRank (currentRank: PartyRank): PartyRank {
  const currentIdx = getRankLevel(currentRank)
  if (currentIdx > 0) {
    return RANK_HIERARCHY[currentIdx - 1]
  }
  return currentRank // Already at lowest rank
}

/**
 * Promote a player to the next higher rank
 * @returns The new rank after promotion, or the same rank if already at highest
 */
export function promoteRank (currentRank: PartyRank): PartyRank {
  const currentIdx = getRankLevel(currentRank)
  if (currentIdx >= 0 && currentIdx < RANK_HIERARCHY.length - 1) {
    return RANK_HIERARCHY[currentIdx + 1]
  }
  return currentRank // Already at highest rank or invalid rank
}

/**
 * Check if a rank is at least the specified minimum rank
 */
export function isRankAtLeast (rank: PartyRank, minimumRank: PartyRank): boolean {
  return getRankLevel(rank) >= getRankLevel(minimumRank)
}

/**
 * Check if a rank is higher than another rank
 */
export function isRankHigherThan (rank: PartyRank, otherRank: PartyRank): boolean {
  return getRankLevel(rank) > getRankLevel(otherRank)
}

/**
 * Get the rank display name
 */
export function getRankDisplayName (rank: PartyRank): string {
  switch (rank) {
    case 'proletariat':
      return 'Proletariat'
    case 'partyMember':
      return 'Party Member'
    case 'commissar':
      return 'Commissar'
    case 'innerCircle':
      return 'Inner Circle'
    default:
      return 'Unknown'
  }
}
