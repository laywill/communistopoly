// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { Player, PartyRank } from '../types/game'

/**
 * Get rank hierarchy level (higher number = higher rank)
 */
function getRankLevel (rank: PartyRank): number {
  const rankOrder: PartyRank[] = ['proletariat', 'partyMember', 'commissar', 'innerCircle']
  return rankOrder.indexOf(rank)
}

/**
 * LENIN STATUE ABILITY: Check if player can be denounced
 * Lenin cannot be denounced by players of lower rank
 */
export function canBeDenouncedBy (accused: Player, accuser: Player): { allowed: boolean, reason?: string } {
  // Lenin Statue protection: Cannot be denounced by lower ranks
  if (accused.piece === 'statueOfLenin') {
    const accusedRankLevel = getRankLevel(accused.rank)
    const accuserRankLevel = getRankLevel(accuser.rank)

    if (accuserRankLevel < accusedRankLevel) {
      return {
        allowed: false,
        reason: `${accused.name}'s Statue of Lenin protects from denouncement by lower ranks`
      }
    }
  }

  return { allowed: true }
}

/**
 * Check if Bread Loaf player is in "starving" state (<100₽)
 */
export function isBreadLoafStarving (player: Player): boolean {
  return player.piece === 'breadLoaf' && player.rubles < 100
}

/**
 * Check if Bread Loaf player is at wealth cap (1000₽)
 */
export function isBreadLoafAtCap (player: Player): boolean {
  return player.piece === 'breadLoaf' && player.rubles >= 1000
}

/**
 * Check if player should show Iron Curtain hidden money
 */
export function shouldHideIronCurtainMoney (player: Player, viewerId: string | null): boolean {
  // Iron Curtain player's money is hidden from other players
  return player.piece === 'ironCurtain' && player.id !== viewerId && !player.isStalin
}

/**
 * Get Vodka Bottle sobriety status message
 */
export function getVodkaSobrietyMessage (vodkaUseCount: number): string {
  if (vodkaUseCount === 0) return 'Sober'
  if (vodkaUseCount <= 2) return 'Slightly tipsy'
  if (vodkaUseCount <= 4) return 'Moderately drunk'
  if (vodkaUseCount <= 6) return 'Very drunk'
  return 'Completely smashed'
}

/**
 * Check if player has any one-time ability available
 */
export function hasAvailableOneTimeAbility (player: Player): boolean {
  switch (player.piece) {
    case 'sickle':
      return !player.hasUsedSickleHarvest
    case 'ironCurtain':
      return !player.hasUsedIronCurtainDisappear
    case 'statueOfLenin':
      return !player.hasUsedLeninSpeech
    case 'tank':
      // Tank has multiple abilities, but all are contextual
      return false
    default:
      return false
  }
}

/**
 * Get ability status text for display
 */
export function getAbilityStatusText (player: Player): string {
  switch (player.piece) {
    case 'hammer':
      return 'Passive: +50₽ at STOY, player-Gulag immunity'
    case 'sickle':
      return player.hasUsedSickleHarvest
        ? 'Harvest: Used | Passive: Half farm quotas'
        : 'Harvest: Available | Passive: Half farm quotas'
    case 'redStar':
      return 'Passive: Double penalties, execution if Proletariat'
    case 'tank':
      return player.hasUsedTankGulagImmunity
        ? 'Gulag immunity: Used | Requisition: Per lap'
        : 'Gulag immunity: Available | Requisition: Per lap'
    case 'breadLoaf':
      return 'Passive: 1000₽ cap, starving if <100₽'
    case 'ironCurtain':
      return player.hasUsedIronCurtainDisappear
        ? 'Disappear: Used | Passive: Hidden money'
        : 'Disappear: Available | Passive: Hidden money'
    case 'vodkaBottle':
      return `3-dice option | Sobriety: ${getVodkaSobrietyMessage(player.vodkaUseCount)}`
    case 'statueOfLenin':
      return player.hasUsedLeninSpeech
        ? 'Speech: Used | Passive: Rank protection'
        : 'Speech: Available | Passive: Rank protection'
    default:
      return 'No special abilities'
  }
}
