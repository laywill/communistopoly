// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { StateCreator } from 'zustand'
import type { GameStore } from '../types/storeTypes'

// Slice state interface
export interface TreasurySliceState {
  stateTreasury: number
}

// Slice actions interface
export interface TreasurySliceActions {
  adjustTreasury: (amount: number) => void
}

// Combined slice type
export type TreasurySlice = TreasurySliceState & TreasurySliceActions

// Initial state for this slice
export const initialTreasuryState: TreasurySliceState = {
  stateTreasury: 0
}

// Slice creator with full typing
export const createTreasurySlice: StateCreator<
  GameStore,
  [],
  [],
  TreasurySlice
> = (set) => ({
  ...initialTreasuryState,

  adjustTreasury: (amount) => {
    set((state) => ({
      stateTreasury: Math.max(0, (state.stateTreasury) + (amount))
    }))
  }
})
