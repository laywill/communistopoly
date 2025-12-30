// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */

import { StateCreator } from 'zustand'
import type { GameState, GulagReason } from '../../types/game'

// ============================================
// STATE
// ============================================

// Note: Most Gulag state lives on Player objects.
// This slice stores voucher and bribe state.

export interface GulagSliceState {
  activeVouchers: import('../../types/game').VoucherAgreement[]
  pendingBribes: import('../../types/game').BribeRequest[]
}

export const initialGulagState: GulagSliceState = {
  activeVouchers: [],
  pendingBribes: [],
}

// ============================================
// ACTIONS
// ============================================

export interface GulagSliceActions {
  // State setters (no business logic)
  setPlayerInGulag: (playerId: string, inGulag: boolean) => void
  setGulagTurns: (playerId: string, turns: number) => void
  incrementGulagTurns: (playerId: string) => void
  setGulagReason: (playerId: string, reason: GulagReason | null) => void

  // Voucher state
  setVoucher: (playerId: string, vouchingFor: string | null, vouchedByRound: number | null) => void
  clearVoucher: (playerId: string) => void
  addVoucher: (voucher: import('../../types/game').VoucherAgreement) => void
  removeVoucher: (voucherId: string) => void
  expireVouchers: () => void

  // Bribe state
  addBribe: (bribe: import('../../types/game').BribeRequest) => void
  removeBribe: (brideId: string) => void
  getBribe: (brideId: string) => import('../../types/game').BribeRequest | undefined

  // Tank immunity
  markTankImmunityUsed: (playerId: string) => void

  // Release from Gulag (used by tribunal informing)
  releaseFromGulag: (playerId: string, reason: string) => void

  // Queries
  getPlayersInGulag: () => string[]
}

export type GulagSlice = GulagSliceState & GulagSliceActions

// ============================================
// SLICE CREATOR
// ============================================

export const createGulagSlice: StateCreator<
  GameState,
  [],
  [],
  GulagSlice
> = (set, get) => ({
  ...initialGulagState,

  setPlayerInGulag: (playerId, inGulag) => {
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, inGulag } : p
      )
    }))
  },

  setGulagTurns: (playerId, turns) => {
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, gulagTurns: turns } : p
      )
    }))
  },

  incrementGulagTurns: (playerId) => {
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, gulagTurns: p.gulagTurns + 1 } : p
      )
    }))
  },

  setGulagReason: (playerId, reason) => {
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, gulagReason: reason } : p
      )
    }))
  },

  setVoucher: (playerId, vouchingFor, vouchedByRound) => {
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId
          ? { ...p, vouchingFor, vouchedByRound }
          : p
      )
    }))
  },

  clearVoucher: (playerId) => {
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId
          ? { ...p, vouchingFor: null, vouchedByRound: null }
          : p
      )
    }))
  },

  addVoucher: (voucher) => {
    const state = get()
    set({
      activeVouchers: [...state.activeVouchers, voucher]
    })
  },

  removeVoucher: (voucherId) => {
    const state = get()
    set({
      activeVouchers: state.activeVouchers.filter((v) => v.id !== voucherId)
    })
  },

  expireVouchers: () => {
    const state = get()
    const currentRound = state.currentRound

    // Find all players with expired vouchers
    const expiredVouchers = state.players.filter(
      (p) => p.vouchingFor !== null && p.vouchedByRound !== null && currentRound > p.vouchedByRound
    )

    // Clear each expired voucher
    expiredVouchers.forEach((voucher) => {
      const vouchee = state.players.find(p => p.id === voucher.vouchingFor)

      if (vouchee) {
        state.addGameLogEntry(
          `${voucher.name}'s voucher for ${vouchee.name} has expired (3 rounds passed without incident)`
        )
      }

      // Use the clearVoucher method to clear the voucher
      get().clearVoucher(voucher.id)
    })
  },

  addBribe: (bribe) => {
    const state = get()
    set({
      pendingBribes: [...state.pendingBribes, bribe]
    })
  },

  removeBribe: (brideId) => {
    const state = get()
    set({
      pendingBribes: state.pendingBribes.filter((b) => b.id !== brideId)
    })
  },

  getBribe: (brideId) => {
    return get().pendingBribes.find((b) => b.id === brideId)
  },

  markTankImmunityUsed: (playerId) => {
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, hasUsedTankGulagImmunity: true } : p
      )
    }))
  },

  releaseFromGulag: (playerId, reason) => {
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId
          ? { ...p, inGulag: false, gulagTurns: 0 }
          : p
      )
    }))
    // Note: Log entry is handled by the calling service
    void reason
  },

  getPlayersInGulag: () => {
    return get().players.filter((p) => p.inGulag).map((p) => p.id)
  }
})
