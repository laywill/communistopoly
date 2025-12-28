// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */

import type { StoreGetter, GameService } from './types'
import type { GameState, PropertyGroup, PartyRank } from '../types/game'
import { BOARD_SPACES } from '../data/spaces'

export interface PropertyService extends GameService {
  /**
   * Check if a player can purchase a property.
   * Returns { allowed: boolean, reason?: string }
   */
  canPurchase: (playerId: string, spaceId: number) => { allowed: boolean; reason?: string }

  /**
   * Purchase a property with full rule processing.
   * Handles: rank restrictions, discounts, piece abilities
   */
  purchaseProperty: (playerId: string, spaceId: number, price: number) => boolean

  /**
   * Calculate the quota for a property.
   * Considers: collectivization, piece abilities, group rules
   */
  calculateQuota: (spaceId: number, landingPlayerId?: string, diceRoll?: number) => number

  /**
   * Pay quota from one player to property custodian.
   */
  payQuota: (payerId: string, spaceId: number, diceRoll?: number) => boolean

  /**
   * Add collectivization level to property.
   * Enforces even building rule across group.
   */
  addCollectivization: (spaceId: number) => boolean

  /**
   * Sell collectivization for half price.
   */
  sellCollectivization: (spaceId: number) => boolean

  /**
   * Mortgage a property.
   */
  mortgageProperty: (spaceId: number) => boolean

  /**
   * Unmortgage a property (pay 110% of mortgage value).
   */
  unmortgageProperty: (spaceId: number) => boolean

  /**
   * Transfer property between players (for trades).
   */
  transferProperty: (spaceId: number, toPlayerId: string) => boolean
}

export function createPropertyService(get: StoreGetter<GameState>): PropertyService {

  const getRankDiscount = (rank: PartyRank): number => {
    switch (rank) {
      case 'partyMember': return 0.10
      case 'commissar': return 0.20
      case 'innerCircle': return 0.50
      default: return 0
    }
  }

  const getCollectivizationBonus = (level: number): number => {
    // Level 0: 0%, Level 1: +50%, Level 2: +100%, Level 3: +150%, Level 4: +200%, Level 5: +300%
    const bonuses = [0, 0.50, 1.00, 1.50, 2.00, 3.00]
    return bonuses[level] ?? 0
  }

  const getCollectivizationCost = (currentLevel: number): number => {
    // Levels 1-4: 100₽, Level 5 (People's Palace): 200₽
    return currentLevel === 4 ? 200 : 100
  }

  const getCollectivizationLevelName = (level: number): string => {
    const names = [
      'Uncollectivized',
      "Worker's Committee",
      'Party Oversight',
      'Full Collectivization',
      'Model Soviet',
      "People's Palace"
    ]
    return names[level] ?? 'Unknown'
  }

  return {
    name: 'PropertyService',

    canPurchase: (playerId, spaceId) => {
      const state = get()
      const player = state.players.find((p) => p.id === playerId)
      const space = BOARD_SPACES.find((s) => s.id === spaceId)
      const property = state.getProperty(spaceId)

      if (!player || !space) {
        return { allowed: false, reason: 'Invalid player or space' }
      }

      if (property?.custodianId !== null) {
        return { allowed: false, reason: 'Property already has a Custodian' }
      }

      // Utilities: Commissar+ only
      if (space.type === 'utility') {
        if (player.rank !== 'commissar' && player.rank !== 'innerCircle') {
          return { allowed: false, reason: 'Only Commissar or Inner Circle may control the Means of Production' }
        }
      }

      // Green (Party Elite): Party Member+ only
      if (space.type === 'property' && space.group === 'elite') {
        if (player.rank === 'proletariat') {
          return { allowed: false, reason: 'Only Party Members or higher may control Party Elite properties' }
        }
      }

      // Dark Blue (Kremlin): Inner Circle only
      if (space.type === 'property' && space.group === 'kremlin') {
        if (player.rank !== 'innerCircle') {
          return { allowed: false, reason: 'Only Inner Circle may control the Kremlin Complex' }
        }
      }

      // Tank cannot control Collective Farms
      if (player.piece === 'tank' && space.type === 'property' && space.group === 'collective') {
        return { allowed: false, reason: 'Tank piece cannot control Collective Farms' }
      }

      return { allowed: true }
    },

    purchaseProperty: (playerId, spaceId, price) => {
      const state = get()
      const player = state.players.find((p) => p.id === playerId)
      const space = BOARD_SPACES.find((s) => s.id === spaceId)

      if (!player || !space) return false

      // Check eligibility
      const canBuy = get().canPurchase?.(playerId, spaceId) ?? { allowed: true }
      if (!canBuy.allowed) {
        const reason = canBuy.reason ?? 'Unknown reason';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/restrict-template-expressions
        (state as any).addLogEntry?.({ type: 'system', message: `Purchase blocked: ${reason}` });
        return false
      }

      // Apply rank discount
      const discount = getRankDiscount(player.rank)
      const finalPrice = Math.floor(price * (1 - discount))

      // Check funds
      if (player.rubles < finalPrice) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (state as any).addLogEntry?.({ type: 'system', message: `${player.name} cannot afford ${String(finalPrice)}₽` });
        return false
      }

      // Execute purchase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (state as any).updatePlayer?.(playerId, { rubles: player.rubles - finalPrice });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (state as any).adjustTreasury?.(finalPrice);
      state.setCustodian(spaceId, playerId)

      const discountText = discount > 0 ? ` (${String(discount * 100)}% discount)` : '';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (state as any).addLogEntry?.({
        type: 'property',
        message: `${player.name} became Custodian of ${space.name} for ${String(finalPrice)}₽${discountText}`
      });

      return true
    },

    calculateQuota: (spaceId, landingPlayerId, diceRoll) => {
      const state = get()
      const property = state.getProperty(spaceId)
      const space = BOARD_SPACES.find((s) => s.id === spaceId)
      const landingPlayer = landingPlayerId
        ? state.players.find((p) => p.id === landingPlayerId)
        : null

      if (!property || !space) return 0
      if (property.mortgaged) return 0
      if (property.custodianId === null) return 0
      if (property.custodianId === landingPlayerId) return 0 // Own property

      let quota = 0

      if (space.type === 'property') {
        // Base quota
        quota = space.baseQuota ?? 0

        // Add collectivization bonus
        const bonus = getCollectivizationBonus(property.collectivizationLevel);
         
        quota = Math.floor(quota * (1 + bonus))

        // Sickle: Halved farm quotas
        if (landingPlayer?.piece === 'sickle' && space.group === 'collective') {
          quota = Math.floor(quota / 2)
        }

        // Green properties: Proletariat pays double
        if (space.group === 'elite' && landingPlayer?.rank === 'proletariat') {
          quota = quota * 2
        }

      } else if (space.type === 'railway') {
        const custodianId = property.custodianId
        const railwayCount = state.getRailwayCount(custodianId)
        quota = railwayCount * 50 // 50, 100, 150, 200

      } else if (space.type === 'utility') {
        // Utility quota = multiplier × dice roll
        if (diceRoll === undefined) return 0
        const custodianId = property.custodianId
        const utilityCount = state.getUtilityCount(custodianId)
        const multiplier = utilityCount === 2 ? 10 : 4
        quota = diceRoll * multiplier
      }

      return quota
    },

    payQuota: (payerId, spaceId, diceRoll) => {
      const state = get()
      const payer = state.players.find((p) => p.id === payerId)
      const property = state.getProperty(spaceId)
      const space = BOARD_SPACES.find((s) => s.id === spaceId)

      if (!payer || !property || !space) return false
      if (!property.custodianId) return true // No one to pay
      if (property.custodianId === payerId) return true // Own property

      const quota = get().calculateQuota?.(spaceId, payerId, diceRoll) ?? 0
      if (quota === 0) return true

      const custodian = state.players.find((p) => p.id === property.custodianId)

      // Check if payer can afford
      if (payer.rubles < quota) {
        // Create debt
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (state as any).createDebt?.(payerId, property.custodianId, quota, 'quota');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (state as any).addLogEntry?.({
          type: 'debt',
          message: `${payer.name} cannot pay ${String(quota)}₽ quota to ${custodian?.name ?? 'Unknown'}! Debt created.`
        });
        return false
      }

      // Transfer money
      const custodianRubles = custodian?.rubles ?? 0;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (state as any).updatePlayer?.(payerId, { rubles: payer.rubles - quota });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/restrict-plus-operands
      (state as any).updatePlayer?.(property.custodianId, { rubles: custodianRubles + quota });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (state as any).addLogEntry?.({
        type: 'property',
        message: `${payer.name} paid ${String(quota)}₽ quota to ${custodian?.name ?? 'Unknown'} for ${space.name}`
      });

      return true
    },

    addCollectivization: (spaceId) => {
      const state = get()
      const property = state.getProperty(spaceId)
      const space = BOARD_SPACES.find((s) => s.id === spaceId)

      if (!property || space?.type !== 'property') return false
      if (property.collectivizationLevel >= 5) return false
      if (property.mortgaged) return false
      if (!property.custodianId) return false

      const custodian = state.players.find((p) => p.id === property.custodianId)
      if (!custodian) return false

      // Check even building rule
      const groupProperties = state.getPropertiesInGroup(space.group!)
      const levels = groupProperties.map((p) => p.collectivizationLevel)
      const minLevel = levels.length > 0 ? Math.min(...levels) : 0

      if (property.collectivizationLevel > minLevel) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (state as any).addLogEntry?.({ type: 'system', message: 'Must build evenly across property group (communist equality!)' });
        return false
      }

      // Check cost
      const cost = getCollectivizationCost(property.collectivizationLevel)
      if (custodian.rubles < cost) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (state as any).addLogEntry?.({ type: 'system', message: `${custodian.name} cannot afford ${String(cost)}₽ for collectivization` });
        return false
      }

      // Execute
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (state as any).updatePlayer?.(custodian.id, { rubles: custodian.rubles - cost });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (state as any).adjustTreasury?.(cost);
      state.incrementCollectivization(spaceId)

      const newLevel = property.collectivizationLevel + 1
      const levelName = getCollectivizationLevelName(newLevel)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (state as any).addLogEntry?.({
        type: 'property',
        message: `${custodian.name} improved ${space.name} to ${levelName} for ${String(cost)}₽`
      });

      return true
    },

    sellCollectivization: (spaceId) => {
      const state = get()
      const property = state.getProperty(spaceId)
      const space = BOARD_SPACES.find((s) => s.id === spaceId)

      if (!property || !space) return false
      if (property.collectivizationLevel === 0) return false
      if (!property.custodianId) return false

      const custodian = state.players.find((p) => p.id === property.custodianId)
      if (!custodian) return false

      // Get half the build cost
      const refund = Math.floor(getCollectivizationCost(property.collectivizationLevel - 1) / 2)

      state.decrementCollectivization(spaceId)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (state as any).updatePlayer?.(property.custodianId, { rubles: custodian.rubles + refund });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (state as any).addLogEntry?.({
        type: 'property',
        message: `${custodian.name} sold collectivization on ${space.name} for ${String(refund)}₽`
      });

      return true
    },

    mortgageProperty: (spaceId) => {
      const state = get()
      const property = state.getProperty(spaceId)
      const space = BOARD_SPACES.find((s) => s.id === spaceId)

      if (!property || !space) return false
      if (property.mortgaged) return false
      if (!property.custodianId) return false
      if (property.collectivizationLevel > 0) return false // Must sell improvements first

      const custodian = state.players.find((p) => p.id === property.custodianId)
      if (!custodian) return false

      const mortgageValue = Math.floor((space.baseCost ?? 0) / 2)

      state.setMortgaged(spaceId, true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (state as any).updatePlayer?.(property.custodianId, { rubles: custodian.rubles + mortgageValue });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (state as any).addLogEntry?.({
        type: 'property',
        message: `${custodian.name} mortgaged ${space.name} for ${String(mortgageValue)}₽`
      });

      return true
    },

    unmortgageProperty: (spaceId) => {
      const state = get()
      const property = state.getProperty(spaceId)
      const space = BOARD_SPACES.find((s) => s.id === spaceId)

      if (!property || !space) return false
      if (!property.mortgaged) return false
      if (!property.custodianId) return false

      const custodian = state.players.find((p) => p.id === property.custodianId)
      if (!custodian) return false

      // Cost is 110% of mortgage value
      const mortgageValue = Math.floor((space.baseCost ?? 0) / 2)
      const unmortgageCost = Math.floor(mortgageValue * 1.1)

      if (custodian.rubles < unmortgageCost) return false

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (state as any).updatePlayer?.(custodian.id, { rubles: custodian.rubles - unmortgageCost });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (state as any).adjustTreasury?.(unmortgageCost);
      state.setMortgaged(spaceId, false)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (state as any).addLogEntry?.({
        type: 'property',
        message: `${custodian.name} unmortgaged ${space.name} for ${String(unmortgageCost)}₽`
      });

      return true
    },

    transferProperty: (spaceId, toPlayerId) => {
      const state = get()
      const property = state.getProperty(spaceId)
      const space = BOARD_SPACES.find((s) => s.id === spaceId)
      const toPlayer = state.players.find((p) => p.id === toPlayerId)

      if (!property || !space || !toPlayer) return false

      // Check if recipient can own this property
      const canOwn = get().canPurchase?.(toPlayerId, spaceId) ?? { allowed: true }
      if (!canOwn.allowed) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (state as any).addLogEntry?.({ type: 'system', message: `Transfer blocked: ${canOwn.reason ?? 'Unknown reason'}` });
        return false
      }

      const fromPlayer = state.players.find((p) => p.id === property.custodianId)

      state.setCustodian(spaceId, toPlayerId)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (state as any).addLogEntry?.({
        type: 'property',
        message: `${space.name} transferred from ${fromPlayer?.name ?? 'State'} to ${toPlayer.name}`
      });

      return true
    },
  }
}
