// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

// Re-export all slices
export { createCardSlice, initialCardState } from './cardSlice'
export type { CardSlice, CardSliceState, CardSliceActions } from './cardSlice'

export { createGulagSlice, initialGulagState } from './gulagSlice'
export type { GulagSlice, GulagSliceState, GulagSliceActions } from './gulagSlice'

export { createPropertySlice, initialPropertyState } from './propertySlice'
export type { PropertySlice, PropertySliceState, PropertySliceActions } from './propertySlice'

export { createTribunalSlice, initialTribunalState } from './tribunalSlice'
export type { TribunalSlice, TribunalSliceState, TribunalSliceActions, Tribunal, TribunalVerdict } from './tribunalSlice'

// Combined slice type (will grow as slices are added)
import type { CardSlice } from './cardSlice'
import type { GulagSlice } from './gulagSlice'
import type { PropertySlice } from './propertySlice'
import type { TribunalSlice } from './tribunalSlice'
export type AllSlices = CardSlice & GulagSlice & PropertySlice & TribunalSlice
