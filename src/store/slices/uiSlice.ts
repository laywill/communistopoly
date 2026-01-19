// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { StateCreator } from 'zustand'
import type { GameStore } from '../types/storeTypes'
import type { PendingAction, BribeRequest } from '../../types/game'

// Slice state interface
export interface UiSliceState {
  isRolling: boolean
  pendingAction: PendingAction | null
  pendingBribes: BribeRequest[]
}

// Slice actions interface
export interface UiSliceActions {
  setPendingAction: (action: PendingAction | null) => void
  submitBribe: (playerId: string, amount: number, reason: string) => void
  respondToBribe: (bribeId: string, accepted: boolean) => void
}

// Combined slice type
export type UiSlice = UiSliceState & UiSliceActions

// Initial state for this slice
export const initialUiState: UiSliceState = {
  isRolling: false,
  pendingAction: null,
  pendingBribes: []
}

// Slice creator with full typing
export const createUiSlice: StateCreator<
  GameStore,
  [],
  [],
  UiSlice
> = (set, get) => ({
  ...initialUiState,

  setPendingAction: (action) => {
    set({ pendingAction: action })
  },

  submitBribe: (playerId, amount, reason) => {
    const state = get()
    const player = state.players.find((p) => p.id === playerId)
    if (player == null || player.rubles < amount) return

    const bribe: BribeRequest = {
      id: `bribe-${String(Date.now())}`,
      playerId,
      amount,
      reason,
      timestamp: new Date()
    }

    set((state) => ({
      pendingBribes: [...state.pendingBribes, bribe]
    }))

    get().addLogEntry({
      type: 'system',
      message: `${player.name} has submitted a bribe of ₽${String(amount)} to Stalin`,
      playerId
    })
  },

  respondToBribe: (bribeId, accepted) => {
    const state = get()
    const bribe = state.pendingBribes.find((b) => b.id === bribeId)
    if (bribe == null) return

    const player = state.players.find((p) => p.id === bribe.playerId)
    if (player == null) return

    // Always take the money
    get().updatePlayer(bribe.playerId, { rubles: player.rubles - bribe.amount })
    get().adjustTreasury(bribe.amount)

    if (accepted) {
      // Release from Gulag or grant favour
      if (bribe.reason === 'gulag-escape' && player.inGulag) {
        get().updatePlayer(bribe.playerId, {
          inGulag: false,
          gulagTurns: 0
        })

        get().addLogEntry({
          type: 'gulag',
          message: `Stalin accepted ${player.name}'s bribe of ₽${String(bribe.amount)} and released them from the Gulag`,
          playerId: bribe.playerId
        })

        // Check if RedStar player at Proletariat should be executed
        get().checkRedStarExecutionAfterGulagRelease(bribe.playerId)

        set({ turnPhase: 'post-turn', pendingAction: null })
      }
    } else {
      // Rejected - money confiscated anyway
      get().addLogEntry({
        type: 'payment',
        message: `Stalin rejected ${player.name}'s bribe of ₽${String(bribe.amount)} and confiscated it as contraband`,
        playerId: bribe.playerId
      })
    }

    // Remove bribe from pending
    set((state) => ({
      pendingBribes: state.pendingBribes.filter((b) => b.id !== bribeId)
    }))
  }
})
