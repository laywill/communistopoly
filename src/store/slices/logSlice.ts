// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { StateCreator } from 'zustand'
import type { GameStore } from '../types/storeTypes'
import type { LogEntry } from '../../types/game'
import { MAX_LOG_ENTRIES } from '../constants'

// Slice state interface
export interface LogSliceState {
  gameLog: LogEntry[]
}

// Slice actions interface
export interface LogSliceActions {
  addLogEntry: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void
}

// Combined slice type
export type LogSlice = LogSliceState & LogSliceActions

// Initial state for this slice
export const initialLogState: LogSliceState = {
  gameLog: []
}

// Slice creator with full typing
export const createLogSlice: StateCreator<
  GameStore,
  [],
  [],
  LogSlice
> = (set) => ({
  ...initialLogState,

  addLogEntry: (entry) => {
    const newEntry: LogEntry = {
      ...entry,
      id: `log-${String(Date.now())}-${String(Math.random())}`,
      timestamp: new Date()
    }

    set((state) => ({
      gameLog: [...state.gameLog, newEntry].slice(-MAX_LOG_ENTRIES)
    }))
  }
})
