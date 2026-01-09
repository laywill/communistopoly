// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { Player } from '../../types/game'
import { useGameStore } from '../../store/gameStore'
import {
  usePieceAbility,
  canDenouncePieceByRank,
  calculateQuotaWithPieceAbility,
  canOwnPropertyGroup,
  applyTestPenaltyMultiplier,
  isImmuneToTrickQuestions
} from '../../hooks/usePieceAbility'
import {
  HAMMER_STOY_BONUS,
  SICKLE_FARM_QUOTA_MODIFIER,
  SICKLE_HARVEST_MAX_VALUE,
  RED_STAR_PENALTY_MULTIPLIER,
  TANK_REQUISITION_AMOUNT,
  BREAD_LOAF_STARVING_THRESHOLD,
  BREAD_LOAF_MAX_RUBLES,
  BREAD_LOAF_INTEREST_RATE,
  LENIN_SPEECH_PAYMENT,
  LENIN_STANDING_FINE
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

describe('usePieceAbility - Hook', () => {
  beforeEach(() => {
    // Reset store to clean state
    useGameStore.setState({
      gamePhase: 'welcome',
      players: [],
      heroesOfSovietUnion: [],
      gameLog: [],
      roundNumber: 1
    })
  })

  describe('Edge cases', () => {
    it('should return canUseAbility: false when player is undefined', () => {
      const { result } = renderHook(() => usePieceAbility(undefined))

      expect(result.current).toEqual({
        canUseAbility: false,
        abilityStatus: null
      })
    })

    it('should return canUseAbility: false when player has no piece', () => {
      const { initializePlayers } = useGameStore.getState()
      initializePlayers([{ name: 'Player 1', piece: null, isStalin: false }])
      const player = useGameStore.getState().players[0]

      const { result } = renderHook(() => usePieceAbility(player))

      expect(result.current).toEqual({
        canUseAbility: false,
        abilityStatus: null
      })
    })
  })

  describe('Hammer piece', () => {
    it('should return correct ability status for Hammer', () => {
      const { initializePlayers } = useGameStore.getState()
      initializePlayers([{ name: 'Player 1', piece: 'hammer', isStalin: false }])
      const player = useGameStore.getState().players[0]

      const { result } = renderHook(() => usePieceAbility(player))

      expect(result.current.piece).toBe('hammer')
      expect(result.current.abilityStatus).toMatchObject({
        passiveBonusActive: true,
        gulagImmunityActive: true
      })
      expect(result.current.abilityStatus?.description).toContain(`₽${String(HAMMER_STOY_BONUS)}`)
      expect(result.current.abilityStatus?.description).toContain('STOY')
      expect(result.current.abilityStatus?.description).toContain('Immune')
    })
  })

  describe('Sickle piece', () => {
    it('should return correct status when harvest NOT used', () => {
      const { initializePlayers } = useGameStore.getState()
      initializePlayers([{ name: 'Player 1', piece: 'sickle', isStalin: false }])
      const player = useGameStore.getState().players[0]

      const { result } = renderHook(() => usePieceAbility(player))

      expect(result.current.piece).toBe('sickle')
      expect(result.current.abilityStatus).toMatchObject({
        farmQuotaModifier: SICKLE_FARM_QUOTA_MODIFIER,
        harvestAvailable: true,
        harvestUsed: false,
        motherlandRequired: true
      })
      expect(result.current.abilityStatus?.description).toContain(`₽${String(SICKLE_HARVEST_MAX_VALUE)}`)
      expect(result.current.abilityStatus?.description).not.toContain('used')
    })

    it('should return correct status when harvest IS used', () => {
      const { initializePlayers } = useGameStore.getState()
      initializePlayers([{ name: 'Player 1', piece: 'sickle', isStalin: false }])
      const player = useGameStore.getState().players[0]

      // Mark harvest as used
      useGameStore.setState({
        players: [{ ...player, hasUsedSickleHarvest: true }]
      })
      const updatedPlayer = useGameStore.getState().players[0]

      const { result } = renderHook(() => usePieceAbility(updatedPlayer))

      expect(result.current.abilityStatus).toMatchObject({
        harvestAvailable: false,
        harvestUsed: true
      })
      expect(result.current.abilityStatus?.description).toContain('Harvest ability used')
    })
  })

  describe('Red Star piece', () => {
    it('should show execution risk when rank is proletariat', () => {
      const { initializePlayers } = useGameStore.getState()
      initializePlayers([{ name: 'Player 1', piece: 'redStar', isStalin: false }])
      const player = useGameStore.getState().players[0]

      // Set rank to proletariat
      useGameStore.setState({
        players: [{ ...player, rank: 'proletariat' }]
      })
      const updatedPlayer = useGameStore.getState().players[0]

      const { result } = renderHook(() => usePieceAbility(updatedPlayer))

      expect(result.current.piece).toBe('redStar')
      expect(result.current.abilityStatus).toMatchObject({
        startedAtPartyMember: true,
        penaltyMultiplier: RED_STAR_PENALTY_MULTIPLIER,
        executionRisk: false
      })
      expect(result.current.abilityStatus?.description).toContain('x2')
      expect(result.current.abilityStatus?.description).toContain('Execution')
    })

    it('should NOT show execution risk when rank is partyMember', () => {
      const { initializePlayers } = useGameStore.getState()
      initializePlayers([{ name: 'Player 1', piece: 'redStar', isStalin: false }])
      const player = useGameStore.getState().players[0]

      const { result } = renderHook(() => usePieceAbility(player))

      expect(result.current.abilityStatus).toMatchObject({
        executionRisk: true
      })
    })
  })

  describe('Tank piece', () => {
    it('should return correct status when gulag immunity NOT used', () => {
      const { initializePlayers } = useGameStore.getState()
      initializePlayers([{ name: 'Player 1', piece: 'tank', isStalin: false }])
      const player = useGameStore.getState().players[0]

      const { result } = renderHook(() => usePieceAbility(player))

      expect(result.current.piece).toBe('tank')
      expect(result.current.abilityStatus).toMatchObject({
        requisitionAmount: TANK_REQUISITION_AMOUNT,
        requisitionAvailable: true,
        gulagImmunityUsed: false,
        cannotOwnFarms: true
      })
      expect(result.current.abilityStatus?.description).toContain(`₽${String(TANK_REQUISITION_AMOUNT)}`)
      expect(result.current.abilityStatus?.description).toContain('Railway')
      expect(result.current.abilityStatus?.description).not.toContain('immunity used')
    })

    it('should return correct status when gulag immunity IS used', () => {
      const { initializePlayers } = useGameStore.getState()
      initializePlayers([{ name: 'Player 1', piece: 'tank', isStalin: false }])
      const player = useGameStore.getState().players[0]

      // Mark gulag immunity as used
      useGameStore.setState({
        players: [{ ...player, hasUsedTankGulagImmunity: true }]
      })
      const updatedPlayer = useGameStore.getState().players[0]

      const { result } = renderHook(() => usePieceAbility(updatedPlayer))

      expect(result.current.abilityStatus).toMatchObject({
        gulagImmunityUsed: true
      })
      expect(result.current.abilityStatus?.description).toContain('immunity used')
    })

    it('should return requisitionAvailable false when used this lap', () => {
      const { initializePlayers } = useGameStore.getState()
      initializePlayers([{ name: 'Player 1', piece: 'tank', isStalin: false }])
      const player = useGameStore.getState().players[0]

      // Mark requisition as used
      useGameStore.setState({
        players: [{ ...player, tankRequisitionUsedThisLap: true }]
      })
      const updatedPlayer = useGameStore.getState().players[0]

      const { result } = renderHook(() => usePieceAbility(updatedPlayer))

      expect(result.current.abilityStatus).toMatchObject({
        requisitionAvailable: false
      })
    })
  })

  describe('Bread Loaf piece', () => {
    it('should show NOT starving when rubles >= threshold', () => {
      const { initializePlayers } = useGameStore.getState()
      initializePlayers([{ name: 'Player 1', piece: 'breadLoaf', isStalin: false }])
      const player = useGameStore.getState().players[0]

      // Set rubles above threshold
      useGameStore.setState({
        players: [{ ...player, rubles: BREAD_LOAF_STARVING_THRESHOLD }]
      })
      const updatedPlayer = useGameStore.getState().players[0]

      const { result } = renderHook(() => usePieceAbility(updatedPlayer))

      expect(result.current.piece).toBe('breadLoaf')
      expect(result.current.abilityStatus).toMatchObject({
        canPayDebts: true,
        isStarving: false,
        isAtMax: false,
        maxRubles: BREAD_LOAF_MAX_RUBLES,
        starvingThreshold: BREAD_LOAF_STARVING_THRESHOLD,
        interestRate: BREAD_LOAF_INTEREST_RATE
      })
      expect(result.current.abilityStatus?.description).toContain('Can pay others')
      expect(result.current.abilityStatus?.description).not.toContain('STARVING')
    })

    it('should show starving when rubles < threshold', () => {
      const { initializePlayers } = useGameStore.getState()
      initializePlayers([{ name: 'Player 1', piece: 'breadLoaf', isStalin: false }])
      const player = useGameStore.getState().players[0]

      // Set rubles below threshold
      useGameStore.setState({
        players: [{ ...player, rubles: BREAD_LOAF_STARVING_THRESHOLD - 1 }]
      })
      const updatedPlayer = useGameStore.getState().players[0]

      const { result } = renderHook(() => usePieceAbility(updatedPlayer))

      expect(result.current.abilityStatus).toMatchObject({
        isStarving: true
      })
      expect(result.current.abilityStatus?.description).toContain('STARVING')
    })

    it('should show isAtMax when rubles >= max', () => {
      const { initializePlayers } = useGameStore.getState()
      initializePlayers([{ name: 'Player 1', piece: 'breadLoaf', isStalin: false }])
      const player = useGameStore.getState().players[0]

      // Set rubles at max
      useGameStore.setState({
        players: [{ ...player, rubles: BREAD_LOAF_MAX_RUBLES }]
      })
      const updatedPlayer = useGameStore.getState().players[0]

      const { result } = renderHook(() => usePieceAbility(updatedPlayer))

      expect(result.current.abilityStatus).toMatchObject({
        isAtMax: true
      })
    })
  })

  describe('Iron Curtain piece', () => {
    it('should return correct status when disappear NOT used', () => {
      const { initializePlayers } = useGameStore.getState()
      initializePlayers([{ name: 'Player 1', piece: 'ironCurtain', isStalin: false }])
      const player = useGameStore.getState().players[0]

      const { result } = renderHook(() => usePieceAbility(player))

      expect(result.current.piece).toBe('ironCurtain')
      expect(result.current.abilityStatus).toMatchObject({
        moneyHidden: true,
        disappearAvailable: true,
        disappearUsed: false
      })
      expect(result.current.abilityStatus?.description).toContain('disappear a property once')
      expect(result.current.abilityStatus?.description).not.toContain('used')
    })

    it('should return correct status when disappear IS used', () => {
      const { initializePlayers } = useGameStore.getState()
      initializePlayers([{ name: 'Player 1', piece: 'ironCurtain', isStalin: false }])
      const player = useGameStore.getState().players[0]

      // Mark disappear as used
      useGameStore.setState({
        players: [{ ...player, hasUsedIronCurtainDisappear: true }]
      })
      const updatedPlayer = useGameStore.getState().players[0]

      const { result } = renderHook(() => usePieceAbility(updatedPlayer))

      expect(result.current.abilityStatus).toMatchObject({
        disappearAvailable: false,
        disappearUsed: true
      })
      expect(result.current.abilityStatus?.description).toContain('Disappear ability used')
    })

    it('should track claimed amount', () => {
      const { initializePlayers } = useGameStore.getState()
      initializePlayers([{ name: 'Player 1', piece: 'ironCurtain', isStalin: false }])
      const player = useGameStore.getState().players[0]

      // Set claimed amount
      useGameStore.setState({
        players: [{ ...player, ironCurtainClaimedRubles: 500 }]
      })
      const updatedPlayer = useGameStore.getState().players[0]

      const { result } = renderHook(() => usePieceAbility(updatedPlayer))

      expect(result.current.abilityStatus).toMatchObject({
        claimedAmount: 500
      })
    })
  })

  describe('Vodka Bottle piece', () => {
    it('should return correct ability status for Vodka Bottle', () => {
      const { initializePlayers } = useGameStore.getState()
      initializePlayers([{ name: 'Player 1', piece: 'vodkaBottle', isStalin: false }])
      const player = useGameStore.getState().players[0]

      const { result } = renderHook(() => usePieceAbility(player))

      expect(result.current.piece).toBe('vodkaBottle')
      expect(result.current.abilityStatus).toMatchObject({
        canRoll3Dice: true,
        sobrietyLevel: 0,
        trickQuestionImmune: true
      })
      expect(result.current.abilityStatus?.description).toContain('Roll 3 dice')
      expect(result.current.abilityStatus?.description).toContain('Immune to trick')
      expect(result.current.abilityStatus?.description).toContain('Uses: 0')
    })

    it('should track vodka use count', () => {
      const { initializePlayers } = useGameStore.getState()
      initializePlayers([{ name: 'Player 1', piece: 'vodkaBottle', isStalin: false }])
      const player = useGameStore.getState().players[0]

      // Increment use count
      useGameStore.setState({
        players: [{ ...player, vodkaUseCount: 3 }]
      })
      const updatedPlayer = useGameStore.getState().players[0]

      const { result } = renderHook(() => usePieceAbility(updatedPlayer))

      expect(result.current.abilityStatus).toMatchObject({
        sobrietyLevel: 3
      })
      expect(result.current.abilityStatus?.description).toContain('Uses: 3')
    })
  })

  describe('Statue of Lenin piece', () => {
    it('should return correct status when speech NOT used', () => {
      const { initializePlayers } = useGameStore.getState()
      initializePlayers([{ name: 'Player 1', piece: 'statueOfLenin', isStalin: false }])
      const player = useGameStore.getState().players[0]

      const { result } = renderHook(() => usePieceAbility(player))

      expect(result.current.piece).toBe('statueOfLenin')
      expect(result.current.abilityStatus).toMatchObject({
        speechAvailable: true,
        speechUsed: false,
        speechPayment: LENIN_SPEECH_PAYMENT,
        standingRequired: true,
        standingFine: LENIN_STANDING_FINE
      })
      expect(result.current.abilityStatus?.description).toContain(`₽${String(LENIN_SPEECH_PAYMENT)}`)
      expect(result.current.abilityStatus?.description).not.toContain('used')
    })

    it('should return correct status when speech IS used', () => {
      const { initializePlayers } = useGameStore.getState()
      initializePlayers([{ name: 'Player 1', piece: 'statueOfLenin', isStalin: false }])
      const player = useGameStore.getState().players[0]

      // Mark speech as used
      useGameStore.setState({
        players: [{ ...player, hasUsedLeninSpeech: true }]
      })
      const updatedPlayer = useGameStore.getState().players[0]

      const { result } = renderHook(() => usePieceAbility(updatedPlayer))

      expect(result.current.abilityStatus).toMatchObject({
        speechAvailable: false,
        speechUsed: true
      })
      expect(result.current.abilityStatus?.description).toContain('Speech ability used')
    })
  })

  describe('Action Functions', () => {
    it('should call gameStore.sickleHarvest with correct params', () => {
      const { initializePlayers } = useGameStore.getState()
      initializePlayers([{ name: 'Player 1', piece: 'sickle', isStalin: false }])
      const player = useGameStore.getState().players[0]

      const sickleHarvestSpy = vi.spyOn(useGameStore.getState(), 'sickleHarvest')

      const { result } = renderHook(() => usePieceAbility(player))
      const targetPropertyId = 5

      act(() => {
        result.current.useSickleHarvest(targetPropertyId)
      })

      expect(sickleHarvestSpy).toHaveBeenCalledWith(player.id, targetPropertyId)
      expect(sickleHarvestSpy).toHaveBeenCalledTimes(1)

      sickleHarvestSpy.mockRestore()
    })

    it('should call gameStore.tankRequisition with correct params', () => {
      const { initializePlayers } = useGameStore.getState()
      initializePlayers([{ name: 'Player 1', piece: 'tank', isStalin: false }])
      const player = useGameStore.getState().players[0]

      const tankRequisitionSpy = vi.spyOn(useGameStore.getState(), 'tankRequisition')

      const { result } = renderHook(() => usePieceAbility(player))
      const targetPlayerId = 'player-2'

      act(() => {
        result.current.useTankRequisition(targetPlayerId)
      })

      expect(tankRequisitionSpy).toHaveBeenCalledWith(player.id, targetPlayerId)
      expect(tankRequisitionSpy).toHaveBeenCalledTimes(1)

      tankRequisitionSpy.mockRestore()
    })

    it('should call gameStore.ironCurtainDisappear with correct params', () => {
      const { initializePlayers } = useGameStore.getState()
      initializePlayers([{ name: 'Player 1', piece: 'ironCurtain', isStalin: false }])
      const player = useGameStore.getState().players[0]

      const ironCurtainDisappearSpy = vi.spyOn(useGameStore.getState(), 'ironCurtainDisappear')

      const { result } = renderHook(() => usePieceAbility(player))
      const targetPropertyId = 10

      act(() => {
        result.current.useIronCurtainDisappear(targetPropertyId)
      })

      expect(ironCurtainDisappearSpy).toHaveBeenCalledWith(player.id, targetPropertyId)
      expect(ironCurtainDisappearSpy).toHaveBeenCalledTimes(1)

      ironCurtainDisappearSpy.mockRestore()
    })

    it('should call gameStore.leninSpeech with correct params', () => {
      const { initializePlayers } = useGameStore.getState()
      initializePlayers([{ name: 'Player 1', piece: 'statueOfLenin', isStalin: false }])
      const player = useGameStore.getState().players[0]

      const leninSpeechSpy = vi.spyOn(useGameStore.getState(), 'leninSpeech')

      const { result } = renderHook(() => usePieceAbility(player))
      const applauders = ['player-2', 'player-3']

      act(() => {
        result.current.useLeninSpeech(applauders)
      })

      expect(leninSpeechSpy).toHaveBeenCalledWith(player.id, applauders)
      expect(leninSpeechSpy).toHaveBeenCalledTimes(1)

      leninSpeechSpy.mockRestore()
    })

    it('should call gameStore.rollVodka3Dice', () => {
      const { initializePlayers } = useGameStore.getState()
      initializePlayers([{ name: 'Player 1', piece: 'vodkaBottle', isStalin: false }])
      const player = useGameStore.getState().players[0]

      // Set currentPlayerIndex so rollVodka3Dice can access the current player
      useGameStore.setState({
        currentPlayerIndex: 0,
        gamePhase: 'playing'
      })

      const rollVodka3DiceSpy = vi.spyOn(useGameStore.getState(), 'rollVodka3Dice')

      const { result } = renderHook(() => usePieceAbility(player))

      act(() => {
        result.current.useVodka3Dice()
      })

      expect(rollVodka3DiceSpy).toHaveBeenCalledWith()
      expect(rollVodka3DiceSpy).toHaveBeenCalledTimes(1)

      rollVodka3DiceSpy.mockRestore()
    })
  })
})
