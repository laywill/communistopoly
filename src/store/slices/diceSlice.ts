// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { StateCreator } from 'zustand'
import type { GameStore } from '../types/storeTypes'
import type { TurnPhase } from '../../types/game'

// Slice state interface
export interface DiceSliceState {
  turnPhase: TurnPhase
  dice: [number, number]
  doublesCount: number
  hasRolled: boolean
  roundNumber: number
}

// Slice actions interface
export interface DiceSliceActions {
  rollDice: () => void
  rollVodka3Dice: () => void
  finishRolling: () => void
  setTurnPhase: (phase: TurnPhase) => void
  incrementRound: () => void
}

// Combined slice type
export type DiceSlice = DiceSliceState & DiceSliceActions

// Initial state for this slice
export const initialDiceState: DiceSliceState = {
  turnPhase: 'pre-roll',
  dice: [1, 1],
  doublesCount: 0,
  hasRolled: false,
  roundNumber: 1
}

// Slice creator with full typing
export const createDiceSlice: StateCreator<
  GameStore,
  [],
  [],
  DiceSlice
> = (set, get) => ({
  ...initialDiceState,

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

  // VODKA BOTTLE ABILITY: Roll 3 dice, use best 2
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
    const { dice, doublesCount, currentPlayerIndex, players } = get()
    const die1: number = dice[0]
    const die2: number = dice[1]
    const isDoubles = die1 === die2
    const newDoublesCount: number = isDoubles ? (doublesCount) + 1 : 0

    // Check for three doubles (counter-revolutionary behaviour)
    if (newDoublesCount >= 3) {
      const currentPlayer = players[currentPlayerIndex]
      get().sendToGulag(currentPlayer.id, 'threeDoubles')
      set({ isRolling: false, doublesCount: 0 })
      return
    }

    set({
      isRolling: false,
      doublesCount: newDoublesCount,
      turnPhase: 'moving'
    })

    // Move the player by the dice total (only if not in Gulag)
    const currentPlayer = players[currentPlayerIndex]

    // Don't move players in Gulag - attemptGulagEscape handles their movement
    if (currentPlayer.inGulag) {
      return
    }

    const diceTotal = die1 + die2
    get().movePlayer(currentPlayer.id, diceTotal)
  },

  setTurnPhase: (phase) => {
    set({ turnPhase: phase })
  },

  incrementRound: () => {
    const state = get()
    const newRound: number = (state.roundNumber) + 1
    set({ roundNumber: newRound })

    // Clear denouncements from last round
    set({ denouncementsThisRound: [] })

    // Reset KGB test preview counter for all players
    state.players.forEach((player) => {
      if (player.kgbTestPreviewsUsedThisRound > 0) {
        get().updatePlayer(player.id, { kgbTestPreviewsUsedThisRound: 0 })
      }
    })

    // Expire vouchers
    get().expireVouchers()

    // Check debt status
    get().checkDebtStatus()

    get().addLogEntry({
      type: 'system',
      message: `Round ${String(newRound)} begins`
    })
  }
})
