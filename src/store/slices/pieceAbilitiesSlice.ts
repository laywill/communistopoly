// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { StateCreator } from 'zustand'
import type { GameStore } from '../types/storeTypes'
import type { Player } from '../../types/game'
import { getSpaceById } from '../../data/spaces'

// This slice has no dedicated state properties - piece ability flags are stored
// on the Player object itself (e.g. tankRequisitionUsedThisLap, hasUsedSickleHarvest).
// It is therefore a pure actions-only slice.

/** Amount requisitioned by the Tank piece per lap */
const TANK_REQUISITION_AMOUNT = 50

/** Maximum property value (base cost) eligible for Sickle Harvest */
const SICKLE_HARVEST_VALUE_THRESHOLD = 150

/** Amount collected per applauder by the Lenin Speech ability */
const LENIN_SPEECH_COLLECTION_AMOUNT = 100

// Slice actions interface
export interface PieceAbilitiesSliceActions {
  // Tank piece: requisition ₽50 from a target player once per lap
  tankRequisition: (tankPlayerId: string, targetPlayerId: string) => void

  // Sickle piece: harvest (steal) a property worth less than ₽150 once per game
  sickleHarvest: (sicklePlayerId: string, targetPropertyId: number) => void

  // Iron Curtain piece: return one property to State ownership once per game
  ironCurtainDisappear: (ironCurtainPlayerId: string, targetPropertyId: number) => void

  // Statue of Lenin piece: collect ₽100 from each applauding player once per game
  leninSpeech: (leninPlayerId: string, applauders: string[]) => void
}

// Combined slice type (actions only - no store-level state)
export type PieceAbilitiesSlice = PieceAbilitiesSliceActions

// Slice creator with full typing
export const createPieceAbilitiesSlice: StateCreator<
  GameStore, // Full store type for cross-slice access via get()
  [],        // Middleware tuple (empty)
  [],        // Middleware tuple (empty)
  PieceAbilitiesSlice // This slice's return type
> = (set, get) => ({
  // Tank piece ability: requisition rubles from a target player.
  // Can only be used once per lap around the board. The flag is reset
  // when the tank player passes Stoy (handled in movementSlice).
  tankRequisition: (tankPlayerId, targetPlayerId) => {
    const state = get()
    const tankPlayer = state.players.find((p) => p.id === tankPlayerId)
    const targetPlayer = state.players.find((p) => p.id === targetPlayerId)

    if (tankPlayer == null || targetPlayer == null) return
    if (tankPlayer.piece !== 'tank') return
    if (tankPlayer.tankRequisitionUsedThisLap) return

    // Requisition ₽50 from target (or all their money if they have less)
    const requisitionAmount = Math.min(TANK_REQUISITION_AMOUNT, targetPlayer.rubles)

    // Accumulate both players' updates so the ability commits in a single
    // set() call rather than one set() per updatePlayer call. A later patch
    // for the same player id merges over an earlier one, mirroring what
    // sequential updatePlayer calls would have produced.
    const patches = new Map<string, Partial<Player>>()
    const applyUpdate = (id: string, updates: Partial<Player>): void => {
      patches.set(id, { ...patches.get(id), ...updates })
    }

    applyUpdate(targetPlayerId, { rubles: targetPlayer.rubles - requisitionAmount })
    applyUpdate(tankPlayerId, {
      rubles: tankPlayer.rubles + requisitionAmount,
      tankRequisitionUsedThisLap: true
    })

    set((current) => ({
      players: current.players.map((p) => patches.has(p.id) ? { ...p, ...patches.get(p.id) } : p)
    }))

    get().addLogEntry({
      type: 'payment',
      message: `${tankPlayer.name}'s Tank requisitioned ₽${String(requisitionAmount)} from ${targetPlayer.name}!`,
      playerId: tankPlayerId
    })
  },

  // Sickle piece ability: harvest (steal) a property worth less than ₽150.
  // Can only be used once per game (tracked via hasUsedSickleHarvest on Player).
  sickleHarvest: (sicklePlayerId, targetPropertyId) => {
    const state = get()
    const sicklePlayer = state.players.find(p => p.id === sicklePlayerId)
    const property = state.properties.find(p => p.spaceId === targetPropertyId)
    const space = getSpaceById(targetPropertyId)

    if ((sicklePlayer == null) || (property == null) || (space == null)) return
    if (sicklePlayer.piece !== 'sickle') return
    if (sicklePlayer.hasUsedSickleHarvest) return

    // Check property value is less than ₽150
    if ((space.baseCost ?? 0) >= SICKLE_HARVEST_VALUE_THRESHOLD) {
      get().addLogEntry({
        type: 'system',
        message: `Cannot harvest ${space.name} - value must be less than ₽${String(SICKLE_HARVEST_VALUE_THRESHOLD)}!`,
        playerId: sicklePlayerId
      })
      return
    }

    // Transfer property to the sickle player
    const oldCustodian = state.players.find(p => p.id === property.custodianId)
    get().setPropertyCustodian(targetPropertyId, sicklePlayerId)

    get().updatePlayer(sicklePlayerId, { hasUsedSickleHarvest: true })

    get().addLogEntry({
      type: 'property',
      message: `${sicklePlayer.name}'s Sickle harvested ${space.name} from ${oldCustodian?.name ?? 'the State'}!`,
      playerId: sicklePlayerId
    })

    set({ pendingAction: null })
  },

  // Iron Curtain piece ability: make one property disappear (return it to State ownership).
  // Can only be used once per game (tracked via hasUsedIronCurtainDisappear on Player).
  ironCurtainDisappear: (ironCurtainPlayerId, targetPropertyId) => {
    const state = get()
    const ironCurtainPlayer = state.players.find(p => p.id === ironCurtainPlayerId)
    const property = state.properties.find(p => p.spaceId === targetPropertyId)
    const space = getSpaceById(targetPropertyId)

    if ((ironCurtainPlayer == null) || (property == null) || (space == null)) return
    if (ironCurtainPlayer.piece !== 'ironCurtain') return
    if (ironCurtainPlayer.hasUsedIronCurtainDisappear) return

    const victimPlayer = state.players.find(p => p.id === property.custodianId)

    // Return property to the State (no custodian)
    get().setPropertyCustodian(targetPropertyId, null)

    get().updatePlayer(ironCurtainPlayer.id, { hasUsedIronCurtainDisappear: true })

    get().addLogEntry({
      type: 'property',
      message: `${ironCurtainPlayer.name}'s Iron Curtain made ${space.name} disappear from ${victimPlayer?.name ?? 'the State'}!`,
      playerId: ironCurtainPlayer.id
    })

    set({ pendingAction: null })
  },

  // Statue of Lenin piece ability: deliver an inspiring speech, collecting ₽100 from
  // each applauding player (or all their money if they have less). Eliminated players
  // are skipped. Can only be used once per game (tracked via hasUsedLeninSpeech on Player).
  leninSpeech: (leninPlayerId, applauders) => {
    const state = get()
    const leninPlayer = state.players.find(p => p.id === leninPlayerId)

    if (leninPlayer == null) return
    if (leninPlayer.piece !== 'statueOfLenin') return
    if (leninPlayer.hasUsedLeninSpeech) return

    // Accumulate every applauder's deduction plus the Lenin player's own
    // update so the whole ability commits in a single set() call rather
    // than one set() per updatePlayer call.
    const patches = new Map<string, Partial<Player>>()
    const applyUpdate = (id: string, updates: Partial<Player>): void => {
      patches.set(id, { ...patches.get(id), ...updates })
    }

    // Collect ₽100 from each applauder (or all their money if they have less)
    let totalCollected = 0
    applauders.forEach(applauderId => {
      const applauder = state.players.find(p => p.id === applauderId)
      if ((applauder != null) && !applauder.isEliminated) {
        const amount = Math.min(LENIN_SPEECH_COLLECTION_AMOUNT, applauder.rubles)
        applyUpdate(applauderId, { rubles: applauder.rubles - amount })
        totalCollected += amount
      }
    })

    applyUpdate(leninPlayerId, {
      rubles: leninPlayer.rubles + totalCollected,
      hasUsedLeninSpeech: true
    })

    set((current) => ({
      players: current.players.map((p) => patches.has(p.id) ? { ...p, ...patches.get(p.id) } : p)
    }))

    get().addLogEntry({
      type: 'payment',
      message: `${leninPlayer.name}'s inspiring speech collected ₽${String(totalCollected)} from ${String(applauders.length)} applauders!`,
      playerId: leninPlayerId
    })

    set({ pendingAction: null })
  }
})
