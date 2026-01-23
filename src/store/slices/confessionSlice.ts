// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { StateCreator } from 'zustand'
import type { GameStore } from '../types/storeTypes'
import type { Confession } from '../../types/game'

// Slice state interface
export interface ConfessionSliceState {
  confessions: Confession[]
}

// Slice actions interface
export interface ConfessionSliceActions {
  submitConfession: (prisonerId: string, confession: string) => void
  reviewConfession: (confessionId: string, accepted: boolean) => void
}

// Combined slice type
export type ConfessionSlice = ConfessionSliceState & ConfessionSliceActions

// Initial state for this slice
export const initialConfessionState: ConfessionSliceState = {
  confessions: []
}

// Slice creator with full typing
export const createConfessionSlice: StateCreator<
  GameStore,
  [],
  [],
  ConfessionSlice
> = (set, get) => ({
  ...initialConfessionState,

  submitConfession: (prisonerId, confession) => {
    const state = get()
    const prisoner = state.players.find((p) => p.id === prisonerId)
    if (!prisoner?.inGulag) return

    const newConfession: Confession = {
      id: `confession-${String(Date.now())}`,
      prisonerId,
      confession,
      timestamp: new Date(),
      reviewed: false
    }

    set((state) => ({
      confessions: [...state.confessions, newConfession]
    }))

    get().addLogEntry({
      type: 'gulag',
      message: `${prisoner.name} has submitted a rehabilitation confession to Stalin`,
      playerId: prisonerId
    })

    // Notify Stalin (set pending action for Stalin to review)
    set({
      pendingAction: {
        type: 'review-confession',
        data: { confessionId: newConfession.id }
      }
    })
  },

  reviewConfession: (confessionId, accepted) => {
    const state = get()
    const confession = state.confessions.find((c) => c.id === confessionId)
    if ((confession == null) || confession.reviewed) return

    const prisoner = state.players.find((p) => p.id === confession.prisonerId)
    if (prisoner == null) return

    // Mark confession as reviewed
    set((state) => ({
      confessions: state.confessions.map((c) =>
        c.id === confessionId ? { ...c, reviewed: true, accepted } : c
      )
    }))

    if (accepted) {
      // Release from Gulag
      get().updatePlayer(confession.prisonerId, {
        inGulag: false,
        gulagTurns: 0
      })

      // Check if RedStar player at Proletariat should be executed
      get().checkRedStarExecutionAfterGulagRelease(confession.prisonerId)

      get().addLogEntry({
        type: 'gulag',
        message: `Stalin accepted ${prisoner.name}'s rehabilitation confession and released them from the Gulag!`,
        playerId: confession.prisonerId
      })
    } else {
      get().addLogEntry({
        type: 'gulag',
        message: `Stalin rejected ${prisoner.name}'s rehabilitation confession. They remain in the Gulag.`,
        playerId: confession.prisonerId
      })
    }

    set({ pendingAction: null })
  }
})
