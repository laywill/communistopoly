// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { StateCreator } from 'zustand'
import type { GameState, LogEntry, LogEntryType, GamePhase } from '../../types/game'

// ============================================
// TYPES
// ============================================

// Re-export for convenience
export type { GamePhase, LogEntry as GameLogEntry }

// ============================================
// STATE
// ============================================

export interface GameFlowSliceState {
  gamePhase: GamePhase
  currentRound: number
  turnOrder: string[] // Player IDs
  currentTurnIndex: number
  diceRoll: [number, number] | null
  doublesCount: number
  gameLog: LogEntry[]
  winner: string | null
  winReason: string | null
  stateTreasury: number
}

export const initialGameFlowState: GameFlowSliceState = {
  gamePhase: 'setup',
  currentRound: 1,
  turnOrder: [],
  currentTurnIndex: 0,
  diceRoll: null,
  doublesCount: 0,
  gameLog: [],
  winner: null,
  winReason: null,
  stateTreasury: 0,
}

const MAX_LOG_ENTRIES = 100

// ============================================
// ACTIONS (Pure state operations)
// ============================================

export interface GameFlowSliceActions {
  // Game lifecycle
  setGamePhase: (phase: GamePhase) => void
  setWinner: (playerId: string | null, reason: string) => void

  // Turn order
  setTurnOrder: (playerIds: string[]) => void
  setCurrentTurnIndex: (index: number) => void

  // Dice
  setDiceRoll: (roll: [number, number] | null) => void
  setDoublesCount: (count: number) => void
  incrementDoublesCount: () => void

  // Rounds
  incrementRound: () => void
  setRound: (round: number) => void

  // Treasury
  addToStateTreasury: (amount: number) => void
  removeFromStateTreasury: (amount: number) => boolean

  // Game log
  addGameLogEntry: (message: string) => void
  clearGameLog: () => void

  // Queries
  getCurrentPlayerId: () => string | undefined
  isPlayersTurn: (playerId: string) => boolean
}

export type GameFlowSlice = GameFlowSliceState & GameFlowSliceActions

// ============================================
// SLICE CREATOR
// ============================================

export const createGameFlowSlice: StateCreator<
  GameState,
  [],
  [],
  GameFlowSlice
> = (set, get) => ({
  ...initialGameFlowState,

  setGamePhase: (phase) => {
    set({ gamePhase: phase } as Partial<GameState>)
  },

  setWinner: (playerId, reason) => {
    set({
      winner: playerId,
      winReason: reason,
      gamePhase: 'ended',
    } as Partial<GameState>)
  },

  setTurnOrder: (playerIds) => {
    set({ turnOrder: playerIds } as Partial<GameState>)
  },

  setCurrentTurnIndex: (index) => {
    set({ currentTurnIndex: index } as Partial<GameState>)
  },

  setDiceRoll: (roll) => {
    set({ diceRoll: roll } as Partial<GameState>)
  },

  setDoublesCount: (count) => {
    set({ doublesCount: count })
  },

  incrementDoublesCount: () => {
    set((state) => ({ doublesCount: state.doublesCount + 1 }))
  },

  incrementRound: () => {
    set((state) => {
      const flowState = state as unknown as GameFlowSliceState
      const newRound = (flowState.currentRound) + 1
      const entry: LogEntry = {
        id: `${String(Date.now())}-${Math.random().toString(36).substring(2, 11)}`,
        message: `═══ Round ${String(newRound)} begins ═══`,
        timestamp: new Date(),
        type: 'system' as LogEntryType,
      }
      return {
        currentRound: newRound,
        gameLog: [entry, ...(flowState.gameLog)].slice(0, MAX_LOG_ENTRIES),
      } as Partial<GameState>
    })

    // Reset denouncement counters for all players at start of new round
    const fullState = get() as unknown as { resetDenouncementCounts?: () => void }
    if (fullState.resetDenouncementCounts) {
      fullState.resetDenouncementCounts()
    }
  },

  setRound: (round) => {
    set({ currentRound: round } as Partial<GameState>)
  },

  addToStateTreasury: (amount) => {
    set((state) => ({ stateTreasury: state.stateTreasury + amount }))
  },

  removeFromStateTreasury: (amount) => {
    const state = get()
    if (state.stateTreasury < amount) return false
    set({ stateTreasury: state.stateTreasury - amount })
    return true
  },

  addGameLogEntry: (message) => {
    const entry: LogEntry = {
      id: `${String(Date.now())}-${Math.random().toString(36).substring(2, 11)}`,
      message,
      timestamp: new Date(),
      type: 'system' as LogEntryType,
    }

    set((state) => ({
      gameLog: [entry, ...state.gameLog].slice(0, MAX_LOG_ENTRIES),
    }))
  },

  clearGameLog: () => {
    set({ gameLog: [] })
  },

  getCurrentPlayerId: () => {
    const state = get() as GameFlowSliceState
    return state.turnOrder[state.currentTurnIndex] ?? undefined
  },

  isPlayersTurn: (playerId) => {
    const state = get() as GameFlowSliceState
    const currentPlayerId = state.turnOrder[state.currentTurnIndex]
    return currentPlayerId === playerId
  },
})
