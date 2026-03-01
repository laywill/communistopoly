// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { StateCreator } from 'zustand'
import type { GameStore } from '../types/storeTypes'
import type { Property } from '../../types/game'
import { BOARD_SPACES, getSpaceById } from '../../data/spaces'
import { COLLECTIVE_FARM_SPACE_IDS, MORTGAGE_VALUE_RATIO, UNMORTGAGE_COST_RATIO } from '../constants'

// Slice state interface
export interface PropertySliceState {
  properties: Property[]
}

// Slice actions interface
export interface PropertySliceActions {
  initializeProperties: () => void
  setPropertyCustodian: (spaceId: number, custodianId: string | null) => void
  updateCollectivizationLevel: (spaceId: number, level: number) => void
  purchaseProperty: (playerId: string, spaceId: number, price: number) => void
  mortgageProperty: (spaceId: number) => void
  unmortgageProperty: (spaceId: number, playerId: string) => void
  transferProperty: (propertyId: string, newCustodianId: string) => void
}

// Combined slice type
export type PropertySlice = PropertySliceState & PropertySliceActions

// Initial state for this slice
export const initialPropertyState: PropertySliceState = {
  properties: []
}

// Slice creator with full typing
export const createPropertySlice: StateCreator<
  GameStore,
  [],
  [],
  PropertySlice
> = (set, get) => ({
  ...initialPropertyState,

  initializeProperties: () => {
    const properties: Property[] = BOARD_SPACES
      .filter((space) => space.type === 'property' || space.type === 'railway' || space.type === 'utility')
      .map((space) => ({
        spaceId: space.id,
        custodianId: null, // All start owned by the STATE
        collectivizationLevel: 0,
        mortgaged: false
      }))

    set({ properties })
  },

  setPropertyCustodian: (spaceId, custodianId) => {
    set((state) => ({
      properties: state.properties.map((prop) =>
        prop.spaceId === spaceId ? { ...prop, custodianId } : prop
      )
    }))
  },

  updateCollectivizationLevel: (spaceId, level) => {
    set((state) => ({
      properties: state.properties.map((prop) =>
        prop.spaceId === spaceId ? { ...prop, collectivizationLevel: level } : prop
      )
    }))
  },

  purchaseProperty: (playerId, spaceId, price) => {
    const state = get()
    const player = state.players.find((p) => p.id === playerId)
    if (player == null || player.rubles < price) return

    // TANK ABILITY: Cannot control any Collective Farm properties
    if (player.piece === 'tank' && (COLLECTIVE_FARM_SPACE_IDS as readonly number[]).includes(spaceId)) {
      const space = getSpaceById(spaceId)
      get().addLogEntry({
        type: 'system',
        message: `${player.name}'s Tank cannot control Collective Farm properties! ${space?.name ?? 'Property'} purchase blocked.`,
        playerId
      })
      set({ pendingAction: null, turnPhase: 'post-turn' })
      return
    }

    // Deduct rubles
    get().updatePlayer(playerId, {
      rubles: player.rubles - price,
      properties: [...player.properties, spaceId.toString()]
    })

    // Set custodian
    get().setPropertyCustodian(spaceId, playerId)

    // Add to treasury
    get().adjustTreasury(price)

    const space = getSpaceById(spaceId)
    get().addLogEntry({
      type: 'property',
      message: `${player.name} became Custodian of ${space?.name ?? 'Unknown'} for ₽${String(price)}`,
      playerId
    })
  },

  mortgageProperty: (spaceId) => {
    const state = get()
    const property = state.properties.find((p) => p.spaceId === spaceId)
    if (property?.custodianId == null) return

    const space = getSpaceById(spaceId)
    const mortgageValue = Math.floor((space?.baseCost ?? 0) * MORTGAGE_VALUE_RATIO)

    // Give player half the base cost
    const player = state.players.find((p) => p.id === property.custodianId)
    if (player != null) {
      const newRubles: number = (player.rubles) + mortgageValue
      get().updatePlayer(player.id, { rubles: newRubles })
    }

    // Mark as mortgaged
    set((state) => ({
      properties: state.properties.map((prop) =>
        prop.spaceId === spaceId ? { ...prop, mortgaged: true } : prop
      )
    }))

    get().addLogEntry({
      type: 'property',
      message: `${player?.name ?? 'Unknown'} mortgaged ${space?.name ?? 'Unknown'} for ₽${String(mortgageValue)}`,
      playerId: property.custodianId
    })
  },

  unmortgageProperty: (spaceId, playerId) => {
    const state = get()
    const property = state.properties.find((p) => p.spaceId === spaceId)
    const player = state.players.find((p) => p.id === playerId)
    if (property == null || player == null) return

    const space = getSpaceById(spaceId)
    const unmortgageCost = Math.floor((space?.baseCost ?? 0) * UNMORTGAGE_COST_RATIO)

    if (player.rubles < unmortgageCost) return

    // Deduct cost
    get().updatePlayer(playerId, { rubles: player.rubles - unmortgageCost })

    // Unmark mortgaged
    set((state) => ({
      properties: state.properties.map((prop) =>
        prop.spaceId === spaceId ? { ...prop, mortgaged: false } : prop
      )
    }))

    get().addLogEntry({
      type: 'property',
      message: `${player.name} unmortgaged ${space?.name ?? 'Unknown'} for ₽${String(unmortgageCost)}`,
      playerId
    })
  },

  transferProperty: (propertyId, newCustodianId) => {
    const state = get()
    const spaceId = parseInt(propertyId)
    const property = state.properties.find((p) => p.spaceId === spaceId)
    if (property == null) return

    const oldCustodianId = property.custodianId

    // Update property custodian
    get().setPropertyCustodian(spaceId, newCustodianId)

    // Remove from old owner's properties array
    if (oldCustodianId != null) {
      const oldOwner = state.players.find((p) => p.id === oldCustodianId)
      if (oldOwner != null) {
        const updatedProperties = oldOwner.properties.filter((id) => id !== propertyId)
        get().updatePlayer(oldCustodianId, { properties: updatedProperties })
      }
    }

    // Add to new owner's properties array
    const newOwner = state.players.find((p) => p.id === newCustodianId)
    if (newOwner != null) {
      const updatedProperties = [...newOwner.properties, propertyId]
      get().updatePlayer(newCustodianId, { properties: updatedProperties })
    }
  }
})
