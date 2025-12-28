// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { StateCreator } from 'zustand'
import type { GameState, Property, PropertyGroup } from '../../types/game'
import { BOARD_SPACES } from '../../data/spaces'

// ============================================
// STATE
// ============================================

export interface PropertySliceState {
  properties: Property[]
}

export const initialPropertyState: PropertySliceState = {
  properties: initializeProperties(),
}

function initializeProperties(): Property[] {
  return BOARD_SPACES
    .filter((space) =>
      space.type === 'property' ||
      space.type === 'railway' ||
      space.type === 'utility'
    )
    .map((space) => ({
      spaceId: space.id,
      custodianId: null,
      collectivizationLevel: 0,
      mortgaged: false,
    }))
}

// ============================================
// ACTIONS (Pure state operations)
// ============================================

export interface PropertySliceActions {
  // Custodianship
  setCustodian: (spaceId: number, playerId: string | null) => void

  // Collectivization
  setCollectivizationLevel: (spaceId: number, level: number) => void
  incrementCollectivization: (spaceId: number) => void
  decrementCollectivization: (spaceId: number) => void

  // Mortgage
  setMortgaged: (spaceId: number, mortgaged: boolean) => void

  // Queries
  getProperty: (spaceId: number) => Property | undefined
  getPropertiesByCustodian: (playerId: string) => Property[]
  getPropertiesInGroup: (group: PropertyGroup) => Property[]
  getCustodianPropertyCount: (playerId: string) => number
  getRailwayCount: (playerId: string) => number
  getUtilityCount: (playerId: string) => number

  // Bulk operations
  resetAllProperties: () => void
  liquidatePlayerProperties: (playerId: string) => void
}

export type PropertySlice = PropertySliceState & PropertySliceActions

// ============================================
// SLICE CREATOR
// ============================================

export const createPropertySlice: StateCreator<
  GameState,
  [],
  [],
  PropertySlice
> = (set, get) => ({
  ...initialPropertyState,

  setCustodian: (spaceId, playerId) => {
    set((state) => ({
      properties: state.properties.map((p) =>
        p.spaceId === spaceId ? { ...p, custodianId: playerId } as Property : p
      ),
    }))
  },

  setCollectivizationLevel: (spaceId, level) => {
    set((state) => ({
      properties: state.properties.map((p) =>
        p.spaceId === spaceId
          ? { ...p, collectivizationLevel: Math.max(0, Math.min(5, level)) }
          : p
      ),
    }))
  },

  incrementCollectivization: (spaceId) => {
    set((state) => ({
      properties: state.properties.map((p) =>
        p.spaceId === spaceId && p.collectivizationLevel < 5
          ? { ...p, collectivizationLevel: p.collectivizationLevel + 1 }
          : p
      ),
    }))
  },

  decrementCollectivization: (spaceId) => {
    set((state) => ({
      properties: state.properties.map((p) =>
        p.spaceId === spaceId && p.collectivizationLevel > 0
          ? { ...p, collectivizationLevel: p.collectivizationLevel - 1 }
          : p
      ),
    }))
  },

  setMortgaged: (spaceId, mortgaged) => {
    set((state) => ({
      properties: state.properties.map((p) =>
        p.spaceId === spaceId ? { ...p, mortgaged } : p
      ),
    }))
  },

  getProperty: (spaceId) => {
    return get().properties.find((p) => p.spaceId === spaceId)
  },

  getPropertiesByCustodian: (playerId) => {
    return get().properties.filter((p) => p.custodianId === playerId)
  },

  getPropertiesInGroup: (group) => {
    const groupSpaceIds: number[] = BOARD_SPACES
      .filter((s) => s.type === 'property' && s.group === group)
      .map((s) => s.id)
    return get().properties.filter((p) => groupSpaceIds.includes(p.spaceId))
  },

  getCustodianPropertyCount: (playerId) => {
    return get().properties.filter((p) => p.custodianId === playerId).length
  },

  getRailwayCount: (playerId) => {
    const railwayIds: number[] = BOARD_SPACES
      .filter((s) => s.type === 'railway')
      .map((s) => s.id)
    return get().properties.filter(
      (p) => p.custodianId === playerId && railwayIds.includes(p.spaceId)
    ).length
  },

  getUtilityCount: (playerId) => {
    const utilityIds: number[] = BOARD_SPACES
      .filter((s) => s.type === 'utility')
      .map((s) => s.id)
    return get().properties.filter(
      (p) => p.custodianId === playerId && utilityIds.includes(p.spaceId)
    ).length
  },

  resetAllProperties: () => {
    set({ properties: initializeProperties() })
  },

  liquidatePlayerProperties: (playerId) => {
    set((state) => ({
      properties: state.properties.map((p) =>
        p.custodianId === playerId
          ? { ...p, custodianId: null, collectivizationLevel: 0, mortgaged: false }
          : p
      ),
    }))
  },
})
