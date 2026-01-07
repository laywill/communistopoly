// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { describe, it, expect } from 'vitest'
import {
  canBeDenouncedBy,
  isBreadLoafStarving,
  isBreadLoafAtCap,
  shouldHideIronCurtainMoney,
  getVodkaSobrietyMessage,
  hasAvailableOneTimeAbility,
  getAbilityStatusText
} from '../../utils/pieceAbilityUtils'
import { createTestPlayer } from '../helpers/gameStateHelpers'

describe('pieceAbilityUtils', () => {
  describe('canBeDenouncedBy', () => {
    it('should allow denouncement when accused is not Lenin Statue', () => {
      const accused = createTestPlayer({ id: 'p1', piece: 'hammer', rank: 'innerCircle' })
      const accuser = createTestPlayer({ id: 'p2', piece: 'sickle', rank: 'proletariat' })

      const result = canBeDenouncedBy(accused, accuser)

      expect(result.allowed).toBe(true)
      expect(result.reason).toBeUndefined()
    })

    it('should allow Lenin Statue to be denounced by same rank', () => {
      const accused = createTestPlayer({ id: 'p1', piece: 'statueOfLenin', rank: 'commissar' })
      const accuser = createTestPlayer({ id: 'p2', piece: 'hammer', rank: 'commissar' })

      const result = canBeDenouncedBy(accused, accuser)

      expect(result.allowed).toBe(true)
      expect(result.reason).toBeUndefined()
    })

    it('should allow Lenin Statue to be denounced by higher rank', () => {
      const accused = createTestPlayer({ id: 'p1', piece: 'statueOfLenin', rank: 'partyMember', name: 'Lenin Player' })
      const accuser = createTestPlayer({ id: 'p2', piece: 'hammer', rank: 'commissar' })

      const result = canBeDenouncedBy(accused, accuser)

      expect(result.allowed).toBe(true)
      expect(result.reason).toBeUndefined()
    })

    it('should block Lenin Statue denouncement by lower rank (proletariat vs partyMember)', () => {
      const accused = createTestPlayer({ id: 'p1', piece: 'statueOfLenin', rank: 'partyMember', name: 'Lenin Player' })
      const accuser = createTestPlayer({ id: 'p2', piece: 'hammer', rank: 'proletariat' })

      const result = canBeDenouncedBy(accused, accuser)

      expect(result.allowed).toBe(false)
      expect(result.reason).toBe("Lenin Player's Statue of Lenin protects from denouncement by lower ranks")
    })

    it('should block Lenin Statue denouncement by lower rank (partyMember vs commissar)', () => {
      const accused = createTestPlayer({ id: 'p1', piece: 'statueOfLenin', rank: 'commissar', name: 'Commissar Lenin' })
      const accuser = createTestPlayer({ id: 'p2', piece: 'tank', rank: 'partyMember' })

      const result = canBeDenouncedBy(accused, accuser)

      expect(result.allowed).toBe(false)
      expect(result.reason).toBe("Commissar Lenin's Statue of Lenin protects from denouncement by lower ranks")
    })

    it('should block Lenin Statue denouncement by lower rank (commissar vs innerCircle)', () => {
      const accused = createTestPlayer({ id: 'p1', piece: 'statueOfLenin', rank: 'innerCircle', name: 'Supreme Lenin' })
      const accuser = createTestPlayer({ id: 'p2', piece: 'vodkaBottle', rank: 'commissar' })

      const result = canBeDenouncedBy(accused, accuser)

      expect(result.allowed).toBe(false)
      expect(result.reason).toBe("Supreme Lenin's Statue of Lenin protects from denouncement by lower ranks")
    })

    it('should block Lenin Statue denouncement by proletariat when accused is innerCircle', () => {
      const accused = createTestPlayer({ id: 'p1', piece: 'statueOfLenin', rank: 'innerCircle', name: 'Top Lenin' })
      const accuser = createTestPlayer({ id: 'p2', piece: 'breadLoaf', rank: 'proletariat' })

      const result = canBeDenouncedBy(accused, accuser)

      expect(result.allowed).toBe(false)
      expect(result.reason).toBe("Top Lenin's Statue of Lenin protects from denouncement by lower ranks")
    })
  })

  describe('isBreadLoafStarving', () => {
    it('should return true when Bread Loaf has less than 100 rubles', () => {
      const player = createTestPlayer({ piece: 'breadLoaf', rubles: 99 })
      expect(isBreadLoafStarving(player)).toBe(true)
    })

    it('should return true when Bread Loaf has 0 rubles', () => {
      const player = createTestPlayer({ piece: 'breadLoaf', rubles: 0 })
      expect(isBreadLoafStarving(player)).toBe(true)
    })

    it('should return false when Bread Loaf has exactly 100 rubles', () => {
      const player = createTestPlayer({ piece: 'breadLoaf', rubles: 100 })
      expect(isBreadLoafStarving(player)).toBe(false)
    })

    it('should return false when Bread Loaf has more than 100 rubles', () => {
      const player = createTestPlayer({ piece: 'breadLoaf', rubles: 500 })
      expect(isBreadLoafStarving(player)).toBe(false)
    })

    it('should return false when non-Bread Loaf piece has less than 100 rubles', () => {
      const player = createTestPlayer({ piece: 'hammer', rubles: 50 })
      expect(isBreadLoafStarving(player)).toBe(false)
    })

    it('should return false when non-Bread Loaf piece has 0 rubles', () => {
      const player = createTestPlayer({ piece: 'tank', rubles: 0 })
      expect(isBreadLoafStarving(player)).toBe(false)
    })
  })

  describe('isBreadLoafAtCap', () => {
    it('should return true when Bread Loaf has exactly 1000 rubles', () => {
      const player = createTestPlayer({ piece: 'breadLoaf', rubles: 1000 })
      expect(isBreadLoafAtCap(player)).toBe(true)
    })

    it('should return true when Bread Loaf has more than 1000 rubles', () => {
      const player = createTestPlayer({ piece: 'breadLoaf', rubles: 1500 })
      expect(isBreadLoafAtCap(player)).toBe(true)
    })

    it('should return false when Bread Loaf has less than 1000 rubles', () => {
      const player = createTestPlayer({ piece: 'breadLoaf', rubles: 999 })
      expect(isBreadLoafAtCap(player)).toBe(false)
    })

    it('should return false when Bread Loaf has 0 rubles', () => {
      const player = createTestPlayer({ piece: 'breadLoaf', rubles: 0 })
      expect(isBreadLoafAtCap(player)).toBe(false)
    })

    it('should return false when non-Bread Loaf piece has 1000+ rubles', () => {
      const player = createTestPlayer({ piece: 'sickle', rubles: 2000 })
      expect(isBreadLoafAtCap(player)).toBe(false)
    })

    it('should return false when non-Bread Loaf piece has exactly 1000 rubles', () => {
      const player = createTestPlayer({ piece: 'vodkaBottle', rubles: 1000 })
      expect(isBreadLoafAtCap(player)).toBe(false)
    })
  })

  describe('shouldHideIronCurtainMoney', () => {
    it('should return true when Iron Curtain player viewed by another player', () => {
      const player = createTestPlayer({ id: 'p1', piece: 'ironCurtain', isStalin: false })
      expect(shouldHideIronCurtainMoney(player, 'p2')).toBe(true)
    })

    it('should return false when Iron Curtain player views their own money', () => {
      const player = createTestPlayer({ id: 'p1', piece: 'ironCurtain', isStalin: false })
      expect(shouldHideIronCurtainMoney(player, 'p1')).toBe(false)
    })

    it('should return false when Iron Curtain player is Stalin', () => {
      const player = createTestPlayer({ id: 'p1', piece: 'ironCurtain', isStalin: true })
      expect(shouldHideIronCurtainMoney(player, 'p2')).toBe(false)
    })

    it('should return true when Iron Curtain player viewed with null viewerId', () => {
      const player = createTestPlayer({ id: 'p1', piece: 'ironCurtain', isStalin: false })
      expect(shouldHideIronCurtainMoney(player, null)).toBe(true)
    })

    it('should return false when non-Iron Curtain player viewed by another player', () => {
      const player = createTestPlayer({ id: 'p1', piece: 'hammer', isStalin: false })
      expect(shouldHideIronCurtainMoney(player, 'p2')).toBe(false)
    })

    it('should return false when non-Iron Curtain player viewed by self', () => {
      const player = createTestPlayer({ id: 'p1', piece: 'tank', isStalin: false })
      expect(shouldHideIronCurtainMoney(player, 'p1')).toBe(false)
    })
  })

  describe('getVodkaSobrietyMessage', () => {
    it('should return "Sober" when vodka use count is 0', () => {
      expect(getVodkaSobrietyMessage(0)).toBe('Sober')
    })

    it('should return "Slightly tipsy" when vodka use count is 1', () => {
      expect(getVodkaSobrietyMessage(1)).toBe('Slightly tipsy')
    })

    it('should return "Slightly tipsy" when vodka use count is 2', () => {
      expect(getVodkaSobrietyMessage(2)).toBe('Slightly tipsy')
    })

    it('should return "Moderately drunk" when vodka use count is 3', () => {
      expect(getVodkaSobrietyMessage(3)).toBe('Moderately drunk')
    })

    it('should return "Moderately drunk" when vodka use count is 4', () => {
      expect(getVodkaSobrietyMessage(4)).toBe('Moderately drunk')
    })

    it('should return "Very drunk" when vodka use count is 5', () => {
      expect(getVodkaSobrietyMessage(5)).toBe('Very drunk')
    })

    it('should return "Very drunk" when vodka use count is 6', () => {
      expect(getVodkaSobrietyMessage(6)).toBe('Very drunk')
    })

    it('should return "Completely smashed" when vodka use count is 7', () => {
      expect(getVodkaSobrietyMessage(7)).toBe('Completely smashed')
    })

    it('should return "Completely smashed" when vodka use count is 10', () => {
      expect(getVodkaSobrietyMessage(10)).toBe('Completely smashed')
    })

    it('should return "Completely smashed" when vodka use count is very high', () => {
      expect(getVodkaSobrietyMessage(100)).toBe('Completely smashed')
    })
  })

  describe('hasAvailableOneTimeAbility', () => {
    it('should return true when Sickle has not used harvest', () => {
      const player = createTestPlayer({ piece: 'sickle', hasUsedSickleHarvest: false })
      expect(hasAvailableOneTimeAbility(player)).toBe(true)
    })

    it('should return false when Sickle has used harvest', () => {
      const player = createTestPlayer({ piece: 'sickle', hasUsedSickleHarvest: true })
      expect(hasAvailableOneTimeAbility(player)).toBe(false)
    })

    it('should return true when Iron Curtain has not used disappear', () => {
      const player = createTestPlayer({ piece: 'ironCurtain', hasUsedIronCurtainDisappear: false })
      expect(hasAvailableOneTimeAbility(player)).toBe(true)
    })

    it('should return false when Iron Curtain has used disappear', () => {
      const player = createTestPlayer({ piece: 'ironCurtain', hasUsedIronCurtainDisappear: true })
      expect(hasAvailableOneTimeAbility(player)).toBe(false)
    })

    it('should return true when Lenin Statue has not used speech', () => {
      const player = createTestPlayer({ piece: 'statueOfLenin', hasUsedLeninSpeech: false })
      expect(hasAvailableOneTimeAbility(player)).toBe(true)
    })

    it('should return false when Lenin Statue has used speech', () => {
      const player = createTestPlayer({ piece: 'statueOfLenin', hasUsedLeninSpeech: true })
      expect(hasAvailableOneTimeAbility(player)).toBe(false)
    })

    it('should return false for Tank piece (contextual abilities only)', () => {
      const player = createTestPlayer({ piece: 'tank', hasUsedTankGulagImmunity: false })
      expect(hasAvailableOneTimeAbility(player)).toBe(false)
    })

    it('should return false for Hammer piece (no one-time ability)', () => {
      const player = createTestPlayer({ piece: 'hammer' })
      expect(hasAvailableOneTimeAbility(player)).toBe(false)
    })

    it('should return false for Red Star piece (no one-time ability)', () => {
      const player = createTestPlayer({ piece: 'redStar' })
      expect(hasAvailableOneTimeAbility(player)).toBe(false)
    })

    it('should return false for Bread Loaf piece (no one-time ability)', () => {
      const player = createTestPlayer({ piece: 'breadLoaf' })
      expect(hasAvailableOneTimeAbility(player)).toBe(false)
    })

    it('should return false for Vodka Bottle piece (no one-time ability)', () => {
      const player = createTestPlayer({ piece: 'vodkaBottle' })
      expect(hasAvailableOneTimeAbility(player)).toBe(false)
    })
  })

  describe('getAbilityStatusText', () => {
    it('should return correct status for Hammer piece', () => {
      const player = createTestPlayer({ piece: 'hammer' })
      expect(getAbilityStatusText(player)).toBe('Passive: +50₽ at STOY, player-Gulag immunity')
    })

    it('should return correct status for Sickle when harvest is available', () => {
      const player = createTestPlayer({ piece: 'sickle', hasUsedSickleHarvest: false })
      expect(getAbilityStatusText(player)).toBe('Harvest: Available | Passive: Half farm quotas')
    })

    it('should return correct status for Sickle when harvest is used', () => {
      const player = createTestPlayer({ piece: 'sickle', hasUsedSickleHarvest: true })
      expect(getAbilityStatusText(player)).toBe('Harvest: Used | Passive: Half farm quotas')
    })

    it('should return correct status for Red Star piece', () => {
      const player = createTestPlayer({ piece: 'redStar' })
      expect(getAbilityStatusText(player)).toBe('Passive: Double penalties, execution if Proletariat')
    })

    it('should return correct status for Tank when Gulag immunity is available', () => {
      const player = createTestPlayer({ piece: 'tank', hasUsedTankGulagImmunity: false })
      expect(getAbilityStatusText(player)).toBe('Gulag immunity: Available | Requisition: Per lap')
    })

    it('should return correct status for Tank when Gulag immunity is used', () => {
      const player = createTestPlayer({ piece: 'tank', hasUsedTankGulagImmunity: true })
      expect(getAbilityStatusText(player)).toBe('Gulag immunity: Used | Requisition: Per lap')
    })

    it('should return correct status for Bread Loaf piece', () => {
      const player = createTestPlayer({ piece: 'breadLoaf' })
      expect(getAbilityStatusText(player)).toBe('Passive: 1000₽ cap, starving if <100₽')
    })

    it('should return correct status for Iron Curtain when disappear is available', () => {
      const player = createTestPlayer({ piece: 'ironCurtain', hasUsedIronCurtainDisappear: false })
      expect(getAbilityStatusText(player)).toBe('Disappear: Available | Passive: Hidden money')
    })

    it('should return correct status for Iron Curtain when disappear is used', () => {
      const player = createTestPlayer({ piece: 'ironCurtain', hasUsedIronCurtainDisappear: true })
      expect(getAbilityStatusText(player)).toBe('Disappear: Used | Passive: Hidden money')
    })

    it('should return correct status for Vodka Bottle when sober', () => {
      const player = createTestPlayer({ piece: 'vodkaBottle', vodkaUseCount: 0 })
      expect(getAbilityStatusText(player)).toBe('3-dice option | Sobriety: Sober')
    })

    it('should return correct status for Vodka Bottle when slightly tipsy', () => {
      const player = createTestPlayer({ piece: 'vodkaBottle', vodkaUseCount: 2 })
      expect(getAbilityStatusText(player)).toBe('3-dice option | Sobriety: Slightly tipsy')
    })

    it('should return correct status for Vodka Bottle when moderately drunk', () => {
      const player = createTestPlayer({ piece: 'vodkaBottle', vodkaUseCount: 4 })
      expect(getAbilityStatusText(player)).toBe('3-dice option | Sobriety: Moderately drunk')
    })

    it('should return correct status for Vodka Bottle when very drunk', () => {
      const player = createTestPlayer({ piece: 'vodkaBottle', vodkaUseCount: 6 })
      expect(getAbilityStatusText(player)).toBe('3-dice option | Sobriety: Very drunk')
    })

    it('should return correct status for Vodka Bottle when completely smashed', () => {
      const player = createTestPlayer({ piece: 'vodkaBottle', vodkaUseCount: 10 })
      expect(getAbilityStatusText(player)).toBe('3-dice option | Sobriety: Completely smashed')
    })

    it('should return correct status for Lenin Statue when speech is available', () => {
      const player = createTestPlayer({ piece: 'statueOfLenin', hasUsedLeninSpeech: false })
      expect(getAbilityStatusText(player)).toBe('Speech: Available | Passive: Rank protection')
    })

    it('should return correct status for Lenin Statue when speech is used', () => {
      const player = createTestPlayer({ piece: 'statueOfLenin', hasUsedLeninSpeech: true })
      expect(getAbilityStatusText(player)).toBe('Speech: Used | Passive: Rank protection')
    })
  })
})
