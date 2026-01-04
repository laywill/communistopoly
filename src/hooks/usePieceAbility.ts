// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { useGameStore } from '../store/gameStore'
import type { Player, PieceType } from '../types/game'
import {
  HAMMER_STOY_BONUS,
  SICKLE_FARM_QUOTA_MODIFIER,
  SICKLE_HARVEST_MAX_VALUE,
  RED_STAR_PENALTY_MULTIPLIER,
  TANK_REQUISITION_AMOUNT,
  BREAD_LOAF_INTEREST_RATE,
  BREAD_LOAF_STARVING_THRESHOLD,
  BREAD_LOAF_MAX_RUBLES,
  LENIN_SPEECH_PAYMENT,
  LENIN_STANDING_FINE
} from '../data/pieceAbilities'

/**
 * Hook for checking and using piece abilities
 */
export function usePieceAbility (player: Player | undefined) {
  const gameStore = useGameStore()

  if (player?.piece == null) {
    return {
      canUseAbility: false,
      abilityStatus: null
    }
  }

  const piece = player.piece

  // Check ability availability based on piece type
  const getAbilityStatus = () => {
    switch (piece) {
      case 'hammer':
        return {
          passiveBonusActive: true,
          gulagImmunityActive: true,
          description: `+₽${String(HAMMER_STOY_BONUS)} when passing STOY. Immune to player denouncements.`
        }

      case 'sickle':
        return {
          farmQuotaModifier: SICKLE_FARM_QUOTA_MODIFIER,
          harvestAvailable: !player.hasUsedSickleHarvest,
          harvestUsed: player.hasUsedSickleHarvest,
          motherlandRequired: true,
          description: player.hasUsedSickleHarvest
            ? 'Harvest ability used. Farm quotas halved.'
            : `Harvest property <₽${String(SICKLE_HARVEST_MAX_VALUE)}. Farm quotas halved.`
        }

      case 'redStar':
        return {
          startedAtPartyMember: true,
          penaltyMultiplier: RED_STAR_PENALTY_MULTIPLIER,
          executionRisk: player.rank === 'partyMember',
          description: `Test penalties x${String(RED_STAR_PENALTY_MULTIPLIER)}. Execution if demoted to Proletariat.`
        }

      case 'tank':
        return {
          requisitionAmount: TANK_REQUISITION_AMOUNT,
          requisitionAvailable: !player.tankRequisitionUsedThisLap,
          gulagImmunityUsed: player.hasUsedTankGulagImmunity,
          cannotOwnFarms: true,
          description: player.hasUsedTankGulagImmunity
            ? `Requisition ₽${String(TANK_REQUISITION_AMOUNT)}/lap. Gulag immunity used.`
            : `Requisition ₽${String(TANK_REQUISITION_AMOUNT)}/lap. First Gulag → Railway.`
        }

      case 'breadLoaf':
        return {
          canPayDebts: true,
          isStarving: player.rubles < BREAD_LOAF_STARVING_THRESHOLD,
          isAtMax: player.rubles >= BREAD_LOAF_MAX_RUBLES,
          maxRubles: BREAD_LOAF_MAX_RUBLES,
          starvingThreshold: BREAD_LOAF_STARVING_THRESHOLD,
          interestRate: BREAD_LOAF_INTEREST_RATE,
          description: player.rubles < BREAD_LOAF_STARVING_THRESHOLD
            ? `STARVING (must beg). Max ₽${String(BREAD_LOAF_MAX_RUBLES)}.`
            : `Can pay others' debts (+${String(BREAD_LOAF_INTEREST_RATE * 100)}%/round). Max ₽${String(BREAD_LOAF_MAX_RUBLES)}.`
        }

      case 'ironCurtain':
        return {
          moneyHidden: true,
          disappearAvailable: !player.hasUsedIronCurtainDisappear,
          disappearUsed: player.hasUsedIronCurtainDisappear,
          claimedAmount: player.ironCurtainClaimedRubles,
          description: player.hasUsedIronCurtainDisappear
            ? 'Disappear ability used. Money hidden.'
            : 'Can disappear a property once. Money hidden.'
        }

      case 'vodkaBottle':
        return {
          canRoll3Dice: true,
          sobrietyLevel: player.vodkaUseCount,
          trickQuestionImmune: true,
          description: `Roll 3 dice, pick 2. Immune to trick questions. Uses: ${String(player.vodkaUseCount)}`
        }

      case 'statueOfLenin':
        return {
          speechAvailable: !player.hasUsedLeninSpeech,
          speechUsed: player.hasUsedLeninSpeech,
          speechPayment: LENIN_SPEECH_PAYMENT,
          standingRequired: true,
          standingFine: LENIN_STANDING_FINE,
          description: player.hasUsedLeninSpeech
            ? 'Speech ability used. Lower ranks cannot denounce.'
            : `Speech for ₽${String(LENIN_SPEECH_PAYMENT)}/player. Lower ranks cannot denounce.`
        }

      default:
        return null
    }
  }

  // Ability action functions
  const useSickleHarvest = (targetPropertyId: number) => {
    gameStore.sickleHarvest(player.id, targetPropertyId)
  }

  const useTankRequisition = (targetPlayerId: string) => {
    gameStore.tankRequisition(player.id, targetPlayerId)
  }

  const useIronCurtainDisappear = (targetPropertyId: number) => {
    gameStore.ironCurtainDisappear(player.id, targetPropertyId)
  }

  const useLeninSpeech = (applauders: string[]) => {
    gameStore.leninSpeech(player.id, applauders)
  }

  const useVodka3Dice = () => {
    gameStore.rollVodka3Dice()
  }

  return {
    piece,
    abilityStatus: getAbilityStatus(),
    useSickleHarvest,
    useTankRequisition,
    useIronCurtainDisappear,
    useLeninSpeech,
    useVodka3Dice
  }
}

/**
 * Helper to check if a player can be denounced by another player based on rank
 */
export function canDenouncePieceByRank (
  denouncer: Player,
  target: Player
): boolean {
  // Statue of Lenin: Cannot be denounced by lower ranks
  if (target.piece === 'statueOfLenin') {
    const rankOrder: Array<Player['rank']> = ['proletariat', 'partyMember', 'commissar', 'innerCircle']
    const denouncerRankIndex = rankOrder.indexOf(denouncer.rank)
    const targetRankIndex = rankOrder.indexOf(target.rank)

    if (denouncerRankIndex < targetRankIndex) {
      return false
    }
  }

  return true
}

/**
 * Helper to calculate quota with piece ability modifiers
 */
export function calculateQuotaWithPieceAbility (
  baseQuota: number,
  payerPiece: PieceType | null,
  propertyGroup: string
): number {
  let finalQuota = baseQuota

  // Sickle: Collective Farm quotas are halved
  if (payerPiece === 'sickle' && propertyGroup === 'collective') {
    finalQuota *= SICKLE_FARM_QUOTA_MODIFIER
  }

  return Math.floor(finalQuota)
}

/**
 * Helper to check if a piece can own properties in a specific group
 */
export function canOwnPropertyGroup (
  piece: PieceType | null,
  propertyGroup: string
): { canOwn: boolean, reason?: string } {
  // Tank: Cannot control Collective Farms
  if (piece === 'tank' && propertyGroup === 'collective') {
    return {
      canOwn: false,
      reason: 'The Tank cannot control Collective Farm properties'
    }
  }

  return { canOwn: true }
}

/**
 * Helper to apply test penalty multiplier for Red Star
 */
export function applyTestPenaltyMultiplier (
  basePenalty: number,
  playerPiece: PieceType | null
): number {
  if (playerPiece === 'redStar') {
    return basePenalty * RED_STAR_PENALTY_MULTIPLIER
  }
  return basePenalty
}

/**
 * Helper to check if player is immune to trick questions
 */
export function isImmuneToTrickQuestions (piece: PieceType | null): boolean {
  return piece === 'vodkaBottle'
}
