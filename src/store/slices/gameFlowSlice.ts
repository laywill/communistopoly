// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { StateCreator } from 'zustand'
import type { GameState, GamePhase, TurnPhase, LogEntry, PendingAction } from '../../types/game'

// State interface
export interface GameFlowSliceState {
  gamePhase: GamePhase
  turnPhase: TurnPhase
  doublesCount: number
  hasRolled: boolean
  roundNumber: number
  dice: [number, number]
  isRolling: boolean
  gameLog: LogEntry[]
  pendingAction: PendingAction | null
  stateTreasury: number
}

// Actions interface
export interface GameFlowSliceActions {
  // Game lifecycle
  setGamePhase: (phase: GamePhase) => void
  startNewGame: () => void

  // Turn management
  setTurnPhase: (phase: TurnPhase) => void
  endTurn: () => void

  // Dice rolling
  rollDice: () => void
  rollVodka3Dice: () => void
  finishRolling: () => void

  // Round management
  incrementRound: () => void

  // Game log
  addLogEntry: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void

  // Treasury
  adjustTreasury: (amount: number) => void

  // Pending actions
  setPendingAction: (action: PendingAction | null) => void

  // STOY handling
  handleStoyPassing: (playerId: string) => void
  handleStoyPilfer: (playerId: string, diceRoll: number) => void
}

// Combined type
export type GameFlowSlice = GameFlowSliceState & GameFlowSliceActions

// Initial state
export const initialGameFlowState: GameFlowSliceState = {
  gamePhase: 'welcome',
  turnPhase: 'pre-roll',
  doublesCount: 0,
  hasRolled: false,
  roundNumber: 1,
  dice: [1, 1],
  isRolling: false,
  gameLog: [],
  pendingAction: null,
  stateTreasury: 0,
}

// Slice creator
export const createGameFlowSlice: StateCreator<
  GameState,
  [],
  [],
  GameFlowSlice
> = (set, get) => ({
  ...initialGameFlowState,

  setGamePhase: (phase) => set({ gamePhase: phase }),

  startNewGame: () => set({ ...initialGameFlowState, gamePhase: 'setup' }),

  setTurnPhase: (phase) => set({ turnPhase: phase }),

  endTurn: () => {
    const state = get()
    const { currentPlayerIndex, players, doublesCount } = state

    // If player rolled doubles and not in gulag, they get another turn
    if ((doublesCount) > 0 && !players[currentPlayerIndex]?.inGulag) {
      set({
        turnPhase: 'pre-roll',
        hasRolled: false,
        pendingAction: null
      })
      return
    }

    // Find next player (skip Stalin and eliminated players, but include Gulag players)
    let nextIndex: number = (currentPlayerIndex + 1) % players.length
    let attempts = 0

    while (
      (players[nextIndex].isStalin || players[nextIndex].isEliminated) &&
      attempts < players.length
    ) {
      nextIndex = (nextIndex + 1) % players.length
      attempts++
    }

    // Check if we've completed a round (cycling back to first non-Stalin player)
    const firstNonStalinIndex: number = players.findIndex((p) => !p.isStalin && !p.isEliminated)
    if (nextIndex === firstNonStalinIndex && currentPlayerIndex !== firstNonStalinIndex) {
      get().incrementRound()
    }

    set({
      currentPlayerIndex: nextIndex,
      turnPhase: 'pre-roll',
      doublesCount: 0,
      hasRolled: false,
      pendingAction: null
    })

    const nextPlayer = players[nextIndex]
    get().addLogEntry({
      type: 'system',
      message: `${nextPlayer.name}'s turn`,
      playerId: nextPlayer.id
    })
  },

  rollDice: () => {
    const die1 = Math.floor(Math.random() * 6) + 1
    const die2 = Math.floor(Math.random() * 6) + 1

    set({
      dice: [die1, die2],
      isRolling: true,
      hasRolled: true,
      turnPhase: 'rolling'
    })

    const currentPlayer = get().players[get().currentPlayerIndex]
    get().addLogEntry({
      type: 'dice',
      message: `Rolled ${String(die1)} + ${String(die2)} = ${String(die1 + die2)}`,
      playerId: currentPlayer.id
    })
  },

  rollVodka3Dice: () => {
    const die1 = Math.floor(Math.random() * 6) + 1
    const die2 = Math.floor(Math.random() * 6) + 1
    const die3 = Math.floor(Math.random() * 6) + 1

    // Find best 2 dice (highest sum)
    const allDice = [die1, die2, die3].sort((a, b) => b - a)
    const bestTwo: [number, number] = [allDice[0], allDice[1]]

    set({
      dice: bestTwo,
      isRolling: true,
      hasRolled: true,
      turnPhase: 'rolling'
    })

    const currentPlayer = get().players[get().currentPlayerIndex]

    // Increment vodka use count
    get().updatePlayer(currentPlayer.id, {
      vodkaUseCount: currentPlayer.vodkaUseCount + 1
    })

    get().addLogEntry({
      type: 'dice',
      message: `${currentPlayer.name} drank and rolled 3 dice: ${String(die1)}, ${String(die2)}, ${String(die3)}. Using best 2: ${String(bestTwo[0])} + ${String(bestTwo[1])} = ${String(bestTwo[0] + bestTwo[1])}`,
      playerId: currentPlayer.id
    })
  },

  finishRolling: () => {
    const { dice, doublesCount } = get()
    const die1: number = dice[0]
    const die2: number = dice[1]
    const isDoubles = die1 === die2
    const newDoublesCount: number = isDoubles ? (doublesCount) + 1 : 0

    // Check for three doubles (counter-revolutionary behavior)
    if (newDoublesCount >= 3) {
      const currentPlayer = get().players[get().currentPlayerIndex]
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      get().sendToGulag(currentPlayer.id, 'threeDoubles')
      set({ isRolling: false, doublesCount: 0 })
      return
    }

    set({
      isRolling: false,
      doublesCount: newDoublesCount,
      turnPhase: 'moving'
    })

    // Move the player
    const currentPlayer = get().players[get().currentPlayerIndex]
    const total = die1 + die2
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    get().movePlayer(currentPlayer.id, total)
  },

  incrementRound: () => {
    const state = get()
    const newRound: number = (state.roundNumber) + 1
    set({ roundNumber: newRound })

    // Clear denouncements from last round
    set({ denouncementsThisRound: [] })

    // Reset KGB test preview counter for all players
    state.players.forEach(player => {
      if (player.kgbTestPreviewsUsedThisRound > 0) {
        get().updatePlayer(player.id, { kgbTestPreviewsUsedThisRound: 0 })
      }
    })

    // Expire vouchers
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    get().expireVouchers()

    // Check debt status
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    get().checkDebtStatus()

    get().addLogEntry({
      type: 'system',
      message: `Round ${String(newRound)} begins`
    })
  },

  addLogEntry: (entry) => {
    const newEntry: LogEntry = {
      ...entry,
      id: `log-${String(Date.now())}-${String(Math.random())}`,
      timestamp: new Date()
    }

    set((state) => ({
      gameLog: [...state.gameLog, newEntry].slice(-50) // Keep last 50 entries
    }))
  },

  adjustTreasury: (amount) => {
    set((state) => ({
      stateTreasury: Math.max(0, (state.stateTreasury) + (amount))
    }))
  },

  setPendingAction: (action) => {
    set({ pendingAction: action })
  },

  handleStoyPassing: (playerId) => {
    const state = get()
    const player = state.players.find((p) => p.id === playerId)
    if (player == null) return

    // Deduct 200₽ travel tax
    get().updatePlayer(playerId, { rubles: player.rubles - 200 })
    get().adjustTreasury(200)

    get().addLogEntry({
      type: 'payment',
      message: `${player.name} paid ₽200 travel tax at STOY`,
      playerId
    })

    // HAMMER ABILITY: +50₽ bonus when passing STOY
    if (player.piece === 'hammer') {
      get().updatePlayer(playerId, { rubles: player.rubles - 200 + 50 }) // Net: -150₽
      get().addLogEntry({
        type: 'payment',
        message: `${player.name}'s Hammer earns +₽50 bonus at STOY!`,
        playerId
      })
    }
  },

  handleStoyPilfer: (playerId, diceRoll) => {
    const state = get()
    const player = state.players.find((p) => p.id === playerId)
    if (player == null) return

    if (diceRoll >= 4) {
      // Success! Steal 100₽ from State
      const newRubles: number = player.rubles + 100
      get().updatePlayer(playerId, { rubles: newRubles })
      get().adjustTreasury(-100)

      get().addLogEntry({
        type: 'payment',
        message: `${player.name} successfully pilfered ₽100 from the State Treasury!`,
        playerId
      })
    } else {
      // Caught! Go to Gulag
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      get().sendToGulag(playerId, 'pilferingCaught')
    }

    set({ pendingAction: null, turnPhase: 'post-turn' })
  },
})
