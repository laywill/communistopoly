// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { describe, it, expect } from 'vitest'
import type { Player } from '../../types/game'
import {
  canDenouncePieceByRank,
  calculateQuotaWithPieceAbility,
  canOwnPropertyGroup,
  applyTestPenaltyMultiplier,
  isImmuneToTrickQuestions
} from '../../hooks/usePieceAbility'
import {
  SICKLE_FARM_QUOTA_MODIFIER,
  RED_STAR_PENALTY_MULTIPLIER
} from '../../data/pieceAbilities'

describe('usePieceAbility - Helper Functions', () => {
  describe('canDenouncePieceByRank', () => {
    it('should allow higher rank to denounce Statue of Lenin', () => {
      const denouncer: Player = {
        id: '1',
        name: 'Denouncer',
        piece: 'hammer',
        rank: 'innerCircle',
        rubles: 0,
        position: 0,
        isInGulag: false,
        gulagTurnsRemaining: 0,
        hasUsedSickleHarvest: false,
        hasUsedIronCurtainDisappear: false,
        hasUsedLeninSpeech: false,
        hasUsedTankGulagImmunity: false,
        tankRequisitionUsedThisLap: false,
        ironCurtainClaimedRubles: 0,
        vodkaUseCount: 0
      }

      const target: Player = {
        id: '2',
        name: 'Lenin',
        piece: 'statueOfLenin',
        rank: 'partyMember',
        rubles: 0,
        position: 0,
        isInGulag: false,
        gulagTurnsRemaining: 0,
        hasUsedSickleHarvest: false,
        hasUsedIronCurtainDisappear: false,
        hasUsedLeninSpeech: false,
        hasUsedTankGulagImmunity: false,
        tankRequisitionUsedThisLap: false,
        ironCurtainClaimedRubles: 0,
        vodkaUseCount: 0
      }

      expect(canDenouncePieceByRank(denouncer, target)).toBe(true)
    })

    it('should allow equal rank to denounce Statue of Lenin', () => {
      const denouncer: Player = {
        id: '1',
        name: 'Denouncer',
        piece: 'hammer',
        rank: 'commissar',
        rubles: 0,
        position: 0,
        isInGulag: false,
        gulagTurnsRemaining: 0,
        hasUsedSickleHarvest: false,
        hasUsedIronCurtainDisappear: false,
        hasUsedLeninSpeech: false,
        hasUsedTankGulagImmunity: false,
        tankRequisitionUsedThisLap: false,
        ironCurtainClaimedRubles: 0,
        vodkaUseCount: 0
      }

      const target: Player = {
        id: '2',
        name: 'Lenin',
        piece: 'statueOfLenin',
        rank: 'commissar',
        rubles: 0,
        position: 0,
        isInGulag: false,
        gulagTurnsRemaining: 0,
        hasUsedSickleHarvest: false,
        hasUsedIronCurtainDisappear: false,
        hasUsedLeninSpeech: false,
        hasUsedTankGulagImmunity: false,
        tankRequisitionUsedThisLap: false,
        ironCurtainClaimedRubles: 0,
        vodkaUseCount: 0
      }

      expect(canDenouncePieceByRank(denouncer, target)).toBe(true)
    })

    it('should NOT allow lower rank to denounce Statue of Lenin', () => {
      const denouncer: Player = {
        id: '1',
        name: 'Denouncer',
        piece: 'hammer',
        rank: 'proletariat',
        rubles: 0,
        position: 0,
        isInGulag: false,
        gulagTurnsRemaining: 0,
        hasUsedSickleHarvest: false,
        hasUsedIronCurtainDisappear: false,
        hasUsedLeninSpeech: false,
        hasUsedTankGulagImmunity: false,
        tankRequisitionUsedThisLap: false,
        ironCurtainClaimedRubles: 0,
        vodkaUseCount: 0
      }

      const target: Player = {
        id: '2',
        name: 'Lenin',
        piece: 'statueOfLenin',
        rank: 'commissar',
        rubles: 0,
        position: 0,
        isInGulag: false,
        gulagTurnsRemaining: 0,
        hasUsedSickleHarvest: false,
        hasUsedIronCurtainDisappear: false,
        hasUsedLeninSpeech: false,
        hasUsedTankGulagImmunity: false,
        tankRequisitionUsedThisLap: false,
        ironCurtainClaimedRubles: 0,
        vodkaUseCount: 0
      }

      expect(canDenouncePieceByRank(denouncer, target)).toBe(false)
    })

    it('should allow anyone to denounce non-Lenin pieces', () => {
      const denouncer: Player = {
        id: '1',
        name: 'Denouncer',
        piece: 'hammer',
        rank: 'proletariat',
        rubles: 0,
        position: 0,
        isInGulag: false,
        gulagTurnsRemaining: 0,
        hasUsedSickleHarvest: false,
        hasUsedIronCurtainDisappear: false,
        hasUsedLeninSpeech: false,
        hasUsedTankGulagImmunity: false,
        tankRequisitionUsedThisLap: false,
        ironCurtainClaimedRubles: 0,
        vodkaUseCount: 0
      }

      const target: Player = {
        id: '2',
        name: 'Target',
        piece: 'hammer',
        rank: 'innerCircle',
        rubles: 0,
        position: 0,
        isInGulag: false,
        gulagTurnsRemaining: 0,
        hasUsedSickleHarvest: false,
        hasUsedIronCurtainDisappear: false,
        hasUsedLeninSpeech: false,
        hasUsedTankGulagImmunity: false,
        tankRequisitionUsedThisLap: false,
        ironCurtainClaimedRubles: 0,
        vodkaUseCount: 0
      }

      expect(canDenouncePieceByRank(denouncer, target)).toBe(true)
    })
  })

  describe('calculateQuotaWithPieceAbility', () => {
    it('should halve quota for Sickle on collective farms', () => {
      const baseQuota = 100
      const result = calculateQuotaWithPieceAbility(baseQuota, 'sickle', 'collective')
      expect(result).toBe(baseQuota * SICKLE_FARM_QUOTA_MODIFIER)
      expect(result).toBe(50)
    })

    it('should NOT modify quota for Sickle on non-farm properties', () => {
      const baseQuota = 100
      const result = calculateQuotaWithPieceAbility(baseQuota, 'sickle', 'factory')
      expect(result).toBe(baseQuota)
    })

    it('should NOT modify quota for non-Sickle on collective farms', () => {
      const baseQuota = 100
      const result = calculateQuotaWithPieceAbility(baseQuota, 'hammer', 'collective')
      expect(result).toBe(baseQuota)
    })

    it('should floor the result', () => {
      const baseQuota = 101
      const result = calculateQuotaWithPieceAbility(baseQuota, 'sickle', 'collective')
      expect(result).toBe(50)
    })

    it('should handle null piece', () => {
      const baseQuota = 100
      const result = calculateQuotaWithPieceAbility(baseQuota, null, 'collective')
      expect(result).toBe(baseQuota)
    })
  })

  describe('canOwnPropertyGroup', () => {
    it('should NOT allow Tank to own collective farms', () => {
      const result = canOwnPropertyGroup('tank', 'collective')
      expect(result.canOwn).toBe(false)
      expect(result.reason).toBe('The Tank cannot control Collective Farm properties')
    })

    it('should allow Tank to own non-farm properties', () => {
      const result = canOwnPropertyGroup('tank', 'factory')
      expect(result.canOwn).toBe(true)
      expect(result.reason).toBeUndefined()
    })

    it('should allow non-Tank pieces to own collective farms', () => {
      const result = canOwnPropertyGroup('sickle', 'collective')
      expect(result.canOwn).toBe(true)
      expect(result.reason).toBeUndefined()
    })

    it('should handle null piece', () => {
      const result = canOwnPropertyGroup(null, 'collective')
      expect(result.canOwn).toBe(true)
    })
  })

  describe('applyTestPenaltyMultiplier', () => {
    it('should double penalty for Red Star', () => {
      const basePenalty = 100
      const result = applyTestPenaltyMultiplier(basePenalty, 'redStar')
      expect(result).toBe(basePenalty * RED_STAR_PENALTY_MULTIPLIER)
      expect(result).toBe(200)
    })

    it('should NOT modify penalty for non-Red Star pieces', () => {
      const basePenalty = 100
      const result = applyTestPenaltyMultiplier(basePenalty, 'hammer')
      expect(result).toBe(basePenalty)
    })

    it('should handle null piece', () => {
      const basePenalty = 100
      const result = applyTestPenaltyMultiplier(basePenalty, null)
      expect(result).toBe(basePenalty)
    })
  })

  describe('isImmuneToTrickQuestions', () => {
    it('should return true for Vodka Bottle', () => {
      expect(isImmuneToTrickQuestions('vodkaBottle')).toBe(true)
    })

    it('should return false for all other pieces', () => {
      expect(isImmuneToTrickQuestions('hammer')).toBe(false)
      expect(isImmuneToTrickQuestions('sickle')).toBe(false)
      expect(isImmuneToTrickQuestions('redStar')).toBe(false)
      expect(isImmuneToTrickQuestions('tank')).toBe(false)
      expect(isImmuneToTrickQuestions('breadLoaf')).toBe(false)
      expect(isImmuneToTrickQuestions('ironCurtain')).toBe(false)
      expect(isImmuneToTrickQuestions('statueOfLenin')).toBe(false)
    })

    it('should return false for null piece', () => {
      expect(isImmuneToTrickQuestions(null)).toBe(false)
    })
  })
})
