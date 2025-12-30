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
  getGulagEscapeRequirement: (turnsInGulag: number) => number[]
  isValidEscapeRoll: (turnsInGulag: number, roll: [number, number]) => boolean
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
  },

  getGulagEscapeRequirement: (turnsInGulag) => {
    // Returns array of acceptable die values for doubles to escape
    // Turn 1: Need 6s (just arrived, turn 0)
    // Turn 2: Need 5s or 6s (turn 1)
    // Turn 3: Need 4, 5, or 6s (turn 2)
    // Turn 4: Need 3, 4, 5, or 6s (turn 3)
    // Turn 5+: Any doubles (turn 4+)
    switch (turnsInGulag) {
      case 0:
      case 1:
        return [6]
      case 2:
        return [5, 6]
      case 3:
        return [4, 5, 6]
      case 4:
        return [3, 4, 5, 6]
      default:
        return [1, 2, 3, 4, 5, 6] // Any doubles after turn 5
    }
  },

  isValidEscapeRoll: (turnsInGulag, roll) => {
    const [die1, die2] = roll
    if (die1 !== die2) return false // Must be doubles

    // Call getGulagEscapeRequirement from the same slice
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const requirements = (get() as any).getGulagEscapeRequirement(turnsInGulag)
    return requirements.includes(die1)
  }
})
