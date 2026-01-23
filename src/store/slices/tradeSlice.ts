// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { StateCreator } from 'zustand'
import type { GameStore } from '../types/storeTypes'
import type { TradeOffer, TradeItems } from '../../types/game'

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
      id: `trade-${String(Date.now())}`,
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

    // Calculate net ruble transfer
    const fromPlayerRubleChange = -trade.offering.rubles + trade.requesting.rubles
    const toPlayerRubleChange = trade.offering.rubles - trade.requesting.rubles

    // Apply ruble changes if any
    if (fromPlayerRubleChange !== 0) {
      get().updatePlayer(fromPlayer.id, { rubles: fromPlayer.rubles + fromPlayerRubleChange })
    }
    if (toPlayerRubleChange !== 0) {
      get().updatePlayer(toPlayer.id, { rubles: toPlayer.rubles + toPlayerRubleChange })
    }

    trade.offering.properties.forEach((propId) => {
      get().transferProperty(propId, toPlayer.id)
    })

    if (trade.offering.gulagCards > 0 && fromPlayer.hasFreeFromGulagCard) {
      get().updatePlayer(fromPlayer.id, { hasFreeFromGulagCard: false })
      get().updatePlayer(toPlayer.id, { hasFreeFromGulagCard: true })
    }

    if (trade.offering.favours > 0) {
      const updatedFavours = fromPlayer.owesFavourTo.filter((id, index) =>
        !(id === toPlayer.id && index < trade.offering.favours)
      )
      get().updatePlayer(fromPlayer.id, { owesFavourTo: updatedFavours })
    }

    // Transfer requesting properties
    trade.requesting.properties.forEach((propId) => {
      get().transferProperty(propId, fromPlayer.id)
    })

    if (trade.requesting.gulagCards > 0 && toPlayer.hasFreeFromGulagCard) {
      get().updatePlayer(toPlayer.id, { hasFreeFromGulagCard: false })
      get().updatePlayer(fromPlayer.id, { hasFreeFromGulagCard: true })
    }

    if (trade.requesting.favours > 0) {
      const updatedFavours = toPlayer.owesFavourTo.filter((id, index) =>
        !(id === fromPlayer.id && index < trade.requesting.favours)
      )
      get().updatePlayer(toPlayer.id, { owesFavourTo: updatedFavours })
    }

    // Mark trade as accepted and remove
    set((state) => ({
      activeTradeOffers: state.activeTradeOffers.filter((t) => t.id !== tradeId)
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
