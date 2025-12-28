// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { StateCreator } from 'zustand'
import type { Property, PropertyGroup } from '../../types/game'
import { BOARD_SPACES, getSpaceById } from '../../data/spaces'
import {
  canPurchaseProperty,
  canImproveProperty,
  getRailwayCount,
  getUtilityCount
} from '../../utils/propertyUtils'

// State interface
export interface PropertySliceState {
  properties: Property[]
}

// Actions interface
export interface PropertySliceActions {
  // Property custodianship
  purchaseProperty: (playerId: string, spaceId: number, price: number) => void
  sellPropertyToState: (playerId: string, spaceId: number) => void
  transferProperty: (propertyId: string, newCustodianId: string) => void
  setPropertyCustodian: (spaceId: number, custodianId: string | null) => void

  // Quota payment
  payQuota: (payerId: string, custodianId: string, amount: number) => void

  // Collectivization/Improvements
  addCollectivization: (spaceId: number, custodianId: string) => boolean
  removeCollectivization: (spaceId: number, custodianId: string) => boolean

  // Mortgage
  mortgageProperty: (spaceId: number) => void
  unmortgageProperty: (spaceId: number, playerId: string) => void

  // Query helpers
  getPropertiesByCustodian: (playerId: string) => Property[]
  getPropertiesInGroup: (group: PropertyGroup) => Property[]
  canPlayerPurchaseProperty: (playerId: string, spaceId: number) => { allowed: boolean, reason?: string }
  getPlayerRailwayCount: (playerId: string) => number
  getPlayerUtilityCount: (playerId: string) => number
}

// Combined slice type
export type PropertySlice = PropertySliceState & PropertySliceActions

// Helper to initialize properties
function initializeProperties(): Property[] {
  return BOARD_SPACES
    .filter((space) => space.type === 'property' || space.type === 'railway' || space.type === 'utility')
    .map((space) => ({
      spaceId: space.id,
      custodianId: null,
      collectivizationLevel: 0,
      mortgaged: false
    }))
}

// Initial state
const initialPropertyState: PropertySliceState = {
  properties: initializeProperties()
}

// Slice creator
// Note: This slice depends on other store functions (updatePlayer, addLogEntry, adjustTreasury)
// which are accessed via get() from the combined store
export const createPropertySlice: StateCreator<
  PropertySlice,
  [],
  [],
  PropertySlice
> = (set, get) => ({
  ...initialPropertyState,

  purchaseProperty: (playerId, spaceId, price) => {
    const state = get() as any
    const player = state.players?.find((p: any) => p.id === playerId)
    if (player == null || player.rubles < price) return

    // TANK ABILITY: Cannot control any Collective Farm properties
    const collectiveFarmSpaces = [6, 8, 9]
    if (player.piece === 'tank' && collectiveFarmSpaces.includes(spaceId)) {
      const space = getSpaceById(spaceId)
      state.addLogEntry?.({
        type: 'system',
        message: `${player.name}'s Tank cannot control Collective Farm properties! ${space?.name ?? 'Property'} purchase blocked.`,
        playerId
      })
      set({ pendingAction: null, turnPhase: 'post-turn' } as any)
      return
    }

    // Deduct rubles
    state.updatePlayer?.(playerId, {
      rubles: player.rubles - price,
      properties: [...player.properties, spaceId.toString()]
    })

    // Set custodian
    get().setPropertyCustodian(spaceId, playerId)

    // Add to treasury
    state.adjustTreasury?.(price)

    const space = getSpaceById(spaceId)
    state.addLogEntry?.({
      type: 'property',
      message: `${player.name} became Custodian of ${space?.name ?? 'Unknown'} for ₽${String(price)}`,
      playerId
    })
  },

  sellPropertyToState: (playerId, spaceId) => {
    const state = get() as any
    const player = state.players?.find((p: any) => p.id === playerId)
    const property = state.properties?.find((p: Property) => p.spaceId === spaceId)

    if (!player || property?.custodianId !== playerId) return

    const space = getSpaceById(spaceId)
    const saleValue = Math.floor((space?.baseCost ?? 0) * 0.5)

    // Remove from player's properties
    state.updatePlayer?.(playerId, {
      properties: player.properties.filter((id: string) => id !== spaceId.toString()),
      rubles: player.rubles + saleValue
    })

    // Clear custodian
    get().setPropertyCustodian(spaceId, null)

    // Reset collectivization
    set((state) => ({
      properties: state.properties.map((p) =>
        p.spaceId === spaceId ? { ...p, collectivizationLevel: 0, mortgaged: false } : p
      )
    } as any))

    state.addLogEntry?.({
      type: 'property',
      message: `${player.name} sold ${space?.name ?? 'Unknown'} to the State for ₽${String(saleValue)}`,
      playerId
    })
  },

  transferProperty: (propertyId, newCustodianId) => {
    const state = get() as any
    const spaceId = parseInt(propertyId)
    const property = state.properties?.find((p: Property) => p.spaceId === spaceId)
    if (property == null) return

    const oldCustodianId = property.custodianId

    // Update property custodian
    get().setPropertyCustodian(spaceId, newCustodianId)

    // Remove from old owner's properties array
    if (oldCustodianId != null) {
      const oldOwner = state.players?.find((p: any) => p.id === oldCustodianId)
      if (oldOwner != null) {
        const updatedProperties = oldOwner.properties.filter((id: string) => id !== propertyId)
        state.updatePlayer?.(oldCustodianId, { properties: updatedProperties })
      }
    }

    // Add to new owner's properties array
    const newOwner = state.players?.find((p: any) => p.id === newCustodianId)
    if (newOwner != null) {
      const updatedProperties = [...newOwner.properties, propertyId]
      state.updatePlayer?.(newCustodianId, { properties: updatedProperties })
    }
  },

  setPropertyCustodian: (spaceId, custodianId) => {
    set((state) => ({
      properties: state.properties.map((prop) =>
        prop.spaceId === spaceId ? { ...prop, custodianId } : prop
      )
    } as any))
  },

  payQuota: (payerId, custodianId, amount) => {
    const state = get() as any
    const payer = state.players?.find((p: any) => p.id === payerId)
    const custodian = state.players?.find((p: any) => p.id === custodianId)
    if (payer == null || custodian == null) return

    // Transfer rubles
    state.updatePlayer?.(payerId, { rubles: payer.rubles - amount })
    state.updatePlayer?.(custodianId, { rubles: custodian.rubles + amount })

    state.addLogEntry?.({
      type: 'payment',
      message: `${payer.name} paid ₽${String(amount)} quota to ${custodian.name}`,
      playerId: payerId
    })
  },

  addCollectivization: (spaceId, custodianId) => {
    const state = get() as any
    const property = state.properties?.find((p: Property) => p.spaceId === spaceId)
    const custodian = state.players?.find((p: any) => p.id === custodianId)
    const space = getSpaceById(spaceId)

    if (!property || !custodian || space?.type !== 'property') return false
    if (property.custodianId !== custodianId) return false

    // Check if can improve
    const canImprove = canImproveProperty(spaceId, custodianId, state.properties ?? [])
    if (!canImprove.canImprove) {
      console.log(`Cannot improve: ${canImprove.reason ?? 'Unknown reason'}`)
      return false
    }

    // Calculate cost
    const cost = property.collectivizationLevel === 4 ? 200 : 100
    if (custodian.rubles < cost) return false

    // Deduct cost and add collectivization
    state.updatePlayer?.(custodianId, { rubles: custodian.rubles - cost })
    state.adjustTreasury?.(cost)

    set((state) => ({
      properties: state.properties.map((p) =>
        p.spaceId === spaceId
          ? { ...p, collectivizationLevel: p.collectivizationLevel + 1 }
          : p
      )
    } as any))

    const levelNames = [
      'None',
      'Worker\'s Committee',
      'Party Oversight',
      'Full Collectivization',
      'Model Soviet',
      'People\'s Palace'
    ]
    const newLevel = property.collectivizationLevel + 1
    const levelName = levelNames[newLevel] ?? 'Unknown'

    state.addLogEntry?.({
      type: 'property',
      message: `${custodian.name} improved ${space.name} to ${levelName} for ₽${String(cost)}`,
      playerId: custodianId
    })

    return true
  },

  removeCollectivization: (spaceId, custodianId) => {
    const state = get() as any
    const property = state.properties?.find((p: Property) => p.spaceId === spaceId)
    const custodian = state.players?.find((p: any) => p.id === custodianId)
    const space = getSpaceById(spaceId)

    if (!property || !custodian || !space) return false
    if (property.custodianId !== custodianId) return false
    if (property.collectivizationLevel === 0) return false

    // Sell back for 50% of cost
    const refund = property.collectivizationLevel === 5 ? 100 : 50
    state.updatePlayer?.(custodianId, { rubles: custodian.rubles + refund })

    set((state) => ({
      properties: state.properties.map((p) =>
        p.spaceId === spaceId
          ? { ...p, collectivizationLevel: Math.max(0, p.collectivizationLevel - 1) }
          : p
      )
    } as any))

    state.addLogEntry?.({
      type: 'property',
      message: `${custodian.name} removed collectivization from ${space.name} for ₽${String(refund)}`,
      playerId: custodianId
    })

    return true
  },

  mortgageProperty: (spaceId) => {
    const state = get() as any
    const property = state.properties?.find((p: Property) => p.spaceId === spaceId)
    if (property?.custodianId == null) return

    const space = getSpaceById(spaceId)
    const mortgageValue = Math.floor((space?.baseCost ?? 0) * 0.5)

    // Give player half the base cost
    const player = state.players?.find((p: any) => p.id === property.custodianId)
    if (player != null) {
      const newRubles: number = (player.rubles) + mortgageValue
      state.updatePlayer?.(player.id, { rubles: newRubles })
    }

    // Mark as mortgaged
    set((state) => ({
      properties: state.properties.map((prop) =>
        prop.spaceId === spaceId ? { ...prop, mortgaged: true } : prop
      )
    } as any))

    state.addLogEntry?.({
      type: 'property',
      message: `${player?.name ?? 'Unknown'} mortgaged ${space?.name ?? 'Unknown'} for ₽${String(mortgageValue)}`,
      playerId: property.custodianId
    })
  },

  unmortgageProperty: (spaceId, playerId) => {
    const state = get() as any
    const property = state.properties?.find((p: Property) => p.spaceId === spaceId)
    const player = state.players?.find((p: any) => p.id === playerId)
    if (property == null || player == null) return

    const space = getSpaceById(spaceId)
    const unmortgageCost = Math.floor((space?.baseCost ?? 0) * 0.6)

    if (player.rubles < unmortgageCost) return

    // Deduct cost
    state.updatePlayer?.(playerId, { rubles: player.rubles - unmortgageCost })

    // Unmark mortgaged
    set((state) => ({
      properties: state.properties.map((prop) =>
        prop.spaceId === spaceId ? { ...prop, mortgaged: false } : prop
      )
    } as any))

    state.addLogEntry?.({
      type: 'property',
      message: `${player.name} unmortgaged ${space?.name ?? 'Unknown'} for ₽${String(unmortgageCost)}`,
      playerId
    })
  },

  getPropertiesByCustodian: (playerId) => {
    return get().properties.filter((p) => p.custodianId === playerId)
  },

  getPropertiesInGroup: (group) => {
    const state = get() as any
    return state.properties?.filter((p: Property) => {
      const space = getSpaceById(p.spaceId)
      return space?.group === group
    }) ?? []
  },

  canPlayerPurchaseProperty: (playerId, spaceId) => {
    const state = get() as any
    const player = state.players?.find((p: any) => p.id === playerId)
    const space = getSpaceById(spaceId)

    if (!player || !space) {
      return { allowed: false, reason: 'Invalid player or space' }
    }

    if (space.type !== 'property' && space.type !== 'railway' && space.type !== 'utility') {
      return { allowed: false, reason: 'Not a purchasable property' }
    }

    const group = space.group
    if (!group) {
      return { allowed: false, reason: 'Property has no group' }
    }

    const canPurchase = canPurchaseProperty(player, group)
    if (!canPurchase) {
      return { allowed: false, reason: getRankRestrictionMessage(player.rank, group, player.piece) }
    }

    return { allowed: true }
  },

  getPlayerRailwayCount: (playerId) => {
    const state = get() as any
    return getRailwayCount(playerId, state.properties ?? [])
  },

  getPlayerUtilityCount: (playerId) => {
    const state = get() as any
    return getUtilityCount(playerId, state.properties ?? [])
  }
})

// Helper function to get rank restriction message
function getRankRestrictionMessage(_rank: any, group: PropertyGroup, piece: any): string {
  if (piece === 'tank' && group === 'collective') {
    return 'Tank piece cannot control Collective Farm properties'
  }

  switch (group) {
    case 'elite':
      return 'Only Party Member or higher may control Party Elite District properties'
    case 'kremlin':
      return 'Only Inner Circle may control Kremlin Complex properties'
    case 'utility':
      return 'Only Commissar or higher may control Utilities'
    default:
      return 'Cannot purchase this property'
  }
}
