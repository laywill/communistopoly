// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { StateCreator } from 'zustand'
import type { GameState, TurnPhase, PendingAction } from '../../types/game'

// ============================================
// STATE
// ============================================

export interface TurnPhaseSliceState {
  turnPhase: TurnPhase
  hasRolled: boolean
  isRolling: boolean
  pendingAction: PendingAction | null
}

export const initialTurnPhaseState: TurnPhaseSliceState = {
  turnPhase: 'pre-roll',
  hasRolled: false,
  isRolling: false,
  pendingAction: null,
}

// ============================================
// ACTIONS (Pure state operations)
// ============================================

export interface TurnPhaseSliceActions {
  // Turn phase management
  setTurnPhase: (phase: TurnPhase) => void
  setHasRolled: (hasRolled: boolean) => void
  setIsRolling: (isRolling: boolean) => void
  finishRolling: () => void
  finishMoving: () => void

  // Pending actions
  setPendingAction: (action: PendingAction | null) => void
}

export type TurnPhaseSlice = TurnPhaseSliceState & TurnPhaseSliceActions

// ============================================
// SLICE CREATOR
// ============================================

export const createTurnPhaseSlice: StateCreator<
  GameState,
  [],
  [],
  TurnPhaseSlice
> = (set) => ({
  ...initialTurnPhaseState,

  setTurnPhase: (phase) => {
    set({ turnPhase: phase })
  },

  setHasRolled: (hasRolled) => {
    set({ hasRolled })
  },

  setIsRolling: (isRolling) => {
    set({ isRolling })
  },

  finishRolling: () => {
    set({
      isRolling: false,
      turnPhase: 'moving',
    })
  },

  finishMoving: () => {
    set({
      turnPhase: 'resolving',
    })
  },

  setPendingAction: (action) => {
    set({ pendingAction: action })
  },
})
