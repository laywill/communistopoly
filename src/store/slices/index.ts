// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

// Re-export all slices
export { createCardSlice, initialCardState } from './cardSlice'
export type { CardSlice, CardSliceState, CardSliceActions } from './cardSlice'

// Combined slice type (will grow as slices are added)
import type { CardSlice } from './cardSlice'
export type AllSlices = CardSlice
