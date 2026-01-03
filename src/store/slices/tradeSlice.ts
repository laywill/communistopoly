// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { StateCreator } from 'zustand'
import type { GameState, TradeOffer } from '../../types/game'

// ============================================
// STATE
// ============================================

export interface TradeSliceState {
  activeTradeOffers: TradeOffer[]
}

export const initialTradeState: TradeSliceState = {
  activeTradeOffers: [],
}

// ============================================
// ACTIONS (Pure state operations)
// ============================================

export interface TradeSliceActions {
  // Trade management
  proposeTrade: (offer: TradeOffer) => void
  acceptTrade: (tradeId: string) => void
  rejectTrade: (tradeId: string) => void
  removeTrade: (tradeId: string) => void
  clearAllTrades: () => void

  // Queries
  getTradeOffer: (tradeId: string) => TradeOffer | undefined
  getTradesForPlayer: (playerId: string) => TradeOffer[]
  getPendingTradesForPlayer: (playerId: string) => TradeOffer[]
}

export type TradeSlice = TradeSliceState & TradeSliceActions

// ============================================
// SLICE CREATOR
// ============================================

export const createTradeSlice: StateCreator<
  GameState,
  [],
  [],
  TradeSlice
> = (set, get) => ({
  ...initialTradeState,

  proposeTrade: (offer) => {
    set((state) => ({
      activeTradeOffers: [...state.activeTradeOffers, offer],
    }))
  },

  acceptTrade: (tradeId) => {
    set((state) => ({
      activeTradeOffers: state.activeTradeOffers.map((trade) =>
        trade.id === tradeId ? { ...trade, status: 'accepted' as const } : trade
      ),
    }))
  },

  rejectTrade: (tradeId) => {
    set((state) => ({
      activeTradeOffers: state.activeTradeOffers.map((trade) =>
        trade.id === tradeId ? { ...trade, status: 'rejected' as const } : trade
      ),
    }))
  },

  removeTrade: (tradeId) => {
    set((state) => ({
      activeTradeOffers: state.activeTradeOffers.filter(
        (trade) => trade.id !== tradeId
      ),
    }))
  },

  clearAllTrades: () => {
    set({ activeTradeOffers: [] })
  },

  getTradeOffer: (tradeId) => {
    return get().activeTradeOffers.find((trade) => trade.id === tradeId)
  },

  getTradesForPlayer: (playerId) => {
    return get().activeTradeOffers.filter(
      (trade) => trade.fromPlayerId === playerId || trade.toPlayerId === playerId
    )
  },

  getPendingTradesForPlayer: (playerId) => {
    return get().activeTradeOffers.filter(
      (trade) =>
        (trade.fromPlayerId === playerId || trade.toPlayerId === playerId) &&
        trade.status === 'pending'
    )
  },
})
