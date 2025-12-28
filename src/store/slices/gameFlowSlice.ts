import { StateCreator } from 'zustand'
import type { GameState } from '../../types/game'

// ============================================
// TYPES
// ============================================

export type GamePhase = 'setup' | 'playing' | 'paused' | 'ended'

export interface GameLogEntry {
  id: string
  message: string
  timestamp: string
  round: number
}

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
  gameLog: GameLogEntry[]
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
    set({ gamePhase: phase })
  },

  setWinner: (playerId, reason) => {
    set({
      winner: playerId,
      winReason: reason,
      gamePhase: 'ended',
    })
  },

  setTurnOrder: (playerIds) => {
    set({ turnOrder: playerIds })
  },

  setCurrentTurnIndex: (index) => {
    set({ currentTurnIndex: index })
  },

  setDiceRoll: (roll) => {
    set({ diceRoll: roll })
  },

  setDoublesCount: (count) => {
    set({ doublesCount: count })
  },

  incrementDoublesCount: () => {
    set((state) => ({ doublesCount: state.doublesCount + 1 }))
  },

  incrementRound: () => {
    set((state) => ({ currentRound: state.currentRound + 1 }))
    get().addGameLogEntry(`═══ Round ${get().currentRound} begins ═══`)
  },

  setRound: (round) => {
    set({ currentRound: round })
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
    const entry: GameLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message,
      timestamp: new Date().toISOString(),
      round: get().currentRound,
    }

    set((state) => ({
      gameLog: [entry, ...state.gameLog].slice(0, MAX_LOG_ENTRIES),
    }))
  },

  clearGameLog: () => {
    set({ gameLog: [] })
  },

  getCurrentPlayerId: () => {
    const state = get()
    return state.turnOrder[state.currentTurnIndex]
  },

  isPlayersTurn: (playerId) => {
    return get().getCurrentPlayerId() === playerId
  },
})
