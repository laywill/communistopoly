// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { StateCreator } from 'zustand'
import type { GameStore } from '../types/storeTypes'
import type { TradeOffer, TradeItems, Player } from '../../types/game'
import { BREAD_LOAF_WEALTH_CAP } from '../constants'

// Slice state interface
export interface TradeSliceState {
  activeTradeOffers: TradeOffer[]
}

// Slice actions interface
export interface TradeSliceActions {
  proposeTrade: (fromPlayerId: string, toPlayerId: string, items: { offering: TradeItems, requesting: TradeItems }) => void
  acceptTrade: (tradeId: string) => void
  rejectTrade: (tradeId: string) => void
}

// Combined slice type
export type TradeSlice = TradeSliceState & TradeSliceActions

// Initial state for this slice
export const initialTradeState: TradeSliceState = {
  activeTradeOffers: []
}

// Slice creator with full typing
export const createTradeSlice: StateCreator<
  GameStore,
  [],
  [],
  TradeSlice
> = (set, get) => ({
  ...initialTradeState,

  proposeTrade: (fromPlayerId, toPlayerId, items) => {
    const state = get()
    const fromPlayer = state.players.find((p) => p.id === fromPlayerId)
    const toPlayer = state.players.find((p) => p.id === toPlayerId)

    if ((fromPlayer == null) || (toPlayer == null)) return

    const tradeOffer: TradeOffer = {
      id: `trade-${crypto.randomUUID()}`,
      fromPlayerId,
      toPlayerId,
      offering: items.offering,
      requesting: items.requesting,
      status: 'pending',
      timestamp: new Date()
    }

    set((state) => ({
      activeTradeOffers: [...state.activeTradeOffers, tradeOffer]
    }))

    get().addLogEntry({
      type: 'system',
      message: `${fromPlayer.name} proposed a trade to ${toPlayer.name}`,
      playerId: fromPlayerId
    })

    // Show trade response modal to the receiving player
    get().setPendingAction({
      type: 'trade-response',
      data: { tradeOfferId: tradeOffer.id }
    })
  },

  acceptTrade: (tradeId) => {
    const state = get()
    const trade = state.activeTradeOffers.find((t) => t.id === tradeId)
    if (trade == null) return

    const fromPlayer = state.players.find((p) => p.id === trade.fromPlayerId)
    const toPlayer = state.players.find((p) => p.id === trade.toPlayerId)
    if ((fromPlayer == null) || (toPlayer == null)) return

    // Accumulate every player/property change this trade causes so the
    // whole thing can be committed in a single set() call, rather than the
    // one set() per field that updatePlayer/transferProperty/
    // setPropertyCustodian would otherwise each trigger individually.
    const playerPatches = new Map<string, Player>()
    const custodianPatches = new Map<number, string>()

    const readPlayer = (id: string): Player | undefined =>
      playerPatches.get(id) ?? state.players.find((p) => p.id === id)

    const readCustodian = (spaceId: number): string | null | undefined =>
      custodianPatches.has(spaceId)
        ? custodianPatches.get(spaceId)
        : state.properties.find((p) => p.spaceId === spaceId)?.custodianId

    // Mirrors updatePlayer's Bread Loaf wealth-cap enforcement (donating
    // the excess to the State and logging it), so batching these writes
    // doesn't change that behaviour.
    const applyPlayerUpdate = (id: string, updates: Partial<Player>): void => {
      const player = readPlayer(id)
      if (player == null) return

      const resolvedUpdates = { ...updates }
      if (player.piece === 'breadLoaf' && resolvedUpdates.rubles !== undefined && resolvedUpdates.rubles > BREAD_LOAF_WEALTH_CAP) {
        const excess = resolvedUpdates.rubles - BREAD_LOAF_WEALTH_CAP
        resolvedUpdates.rubles = BREAD_LOAF_WEALTH_CAP

        get().adjustTreasury(excess)
        get().addLogEntry({
          type: 'payment',
          message: `${player.name}'s Bread Loaf forces donation of ₽${String(excess)} to the State (max ${String(BREAD_LOAF_WEALTH_CAP)}₽)`,
          playerId: id
        })
      }

      playerPatches.set(id, { ...player, ...resolvedUpdates })
    }

    // Mirrors transferProperty: moves a property's custodianship and keeps
    // both the old and new owner's `properties` arrays in sync.
    const applyPropertyTransfer = (propertyId: string, newCustodianId: string): void => {
      const spaceId = parseInt(propertyId)
      const propertyExists = state.properties.some((p) => p.spaceId === spaceId)
      if (!propertyExists) return

      const oldCustodianId = readCustodian(spaceId)
      custodianPatches.set(spaceId, newCustodianId)

      if (oldCustodianId != null) {
        const oldOwner = readPlayer(oldCustodianId)
        if (oldOwner != null) {
          applyPlayerUpdate(oldCustodianId, { properties: oldOwner.properties.filter((id) => id !== propertyId) })
        }
      }

      const newOwner = readPlayer(newCustodianId)
      if (newOwner != null) {
        applyPlayerUpdate(newCustodianId, { properties: [...newOwner.properties, propertyId] })
      }
    }

    // Calculate net ruble transfer
    const fromPlayerRubleChange = -trade.offering.rubles + trade.requesting.rubles
    const toPlayerRubleChange = trade.offering.rubles - trade.requesting.rubles

    // Apply ruble changes if any
    if (fromPlayerRubleChange !== 0) {
      applyPlayerUpdate(fromPlayer.id, { rubles: fromPlayer.rubles + fromPlayerRubleChange })
    }
    if (toPlayerRubleChange !== 0) {
      applyPlayerUpdate(toPlayer.id, { rubles: toPlayer.rubles + toPlayerRubleChange })
    }

    trade.offering.properties.forEach((propId) => {
      applyPropertyTransfer(propId, toPlayer.id)
    })

    if (trade.offering.gulagCards > 0 && fromPlayer.hasFreeFromGulagCard) {
      applyPlayerUpdate(fromPlayer.id, { hasFreeFromGulagCard: false })
      applyPlayerUpdate(toPlayer.id, { hasFreeFromGulagCard: true })
    }

    if (trade.offering.favours > 0) {
      const currentFromPlayer = readPlayer(fromPlayer.id) ?? fromPlayer
      const updatedFavours = currentFromPlayer.owesFavourTo.filter((id, index) =>
        !(id === toPlayer.id && index < trade.offering.favours)
      )
      applyPlayerUpdate(fromPlayer.id, { owesFavourTo: updatedFavours })
    }

    // Transfer requesting properties
    trade.requesting.properties.forEach((propId) => {
      applyPropertyTransfer(propId, fromPlayer.id)
    })

    if (trade.requesting.gulagCards > 0 && toPlayer.hasFreeFromGulagCard) {
      applyPlayerUpdate(toPlayer.id, { hasFreeFromGulagCard: false })
      applyPlayerUpdate(fromPlayer.id, { hasFreeFromGulagCard: true })
    }

    if (trade.requesting.favours > 0) {
      const currentToPlayer = readPlayer(toPlayer.id) ?? toPlayer
      const updatedFavours = currentToPlayer.owesFavourTo.filter((id, index) =>
        !(id === fromPlayer.id && index < trade.requesting.favours)
      )
      applyPlayerUpdate(toPlayer.id, { owesFavourTo: updatedFavours })
    }

    // Commit every accumulated player/property change plus the trade-offer
    // removal in a single write.
    set((current) => ({
      players: playerPatches.size > 0
        ? current.players.map((p) => playerPatches.get(p.id) ?? p)
        : current.players,
      properties: custodianPatches.size > 0
        ? current.properties.map((p) => custodianPatches.has(p.spaceId) ? { ...p, custodianId: custodianPatches.get(p.spaceId) ?? null } : p)
        : current.properties,
      activeTradeOffers: current.activeTradeOffers.filter((t) => t.id !== tradeId)
    }))

    get().addLogEntry({
      type: 'property',
      message: `${toPlayer.name} accepted trade from ${fromPlayer.name}`,
      playerId: toPlayer.id
    })
  },

  rejectTrade: (tradeId) => {
    const state = get()
    const trade = state.activeTradeOffers.find((t) => t.id === tradeId)
    if (trade == null) return

    const fromPlayer = state.players.find((p) => p.id === trade.fromPlayerId)
    const toPlayer = state.players.find((p) => p.id === trade.toPlayerId)

    // Mark trade as rejected and remove
    set((state) => ({
      activeTradeOffers: state.activeTradeOffers.filter((t) => t.id !== tradeId)
    }))

    if ((fromPlayer != null) && (toPlayer != null)) {
      get().addLogEntry({
        type: 'system',
        message: `${toPlayer.name} rejected trade from ${fromPlayer.name}`,
        playerId: toPlayer.id
      })
    }
  }
})
