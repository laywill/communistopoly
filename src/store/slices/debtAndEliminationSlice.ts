// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { StateCreator } from 'zustand'
import type { GameStore } from '../types/storeTypes'
import type { EliminationReason } from '../../types/game'
import { getEliminationMessage } from '../helpers/eliminationHelpers'
import { calculateTotalWealth } from '../helpers/wealthCalculation'

// Slice state interface
// Note: Debt information is stored in player state (player.debt, player.debtCreatedAtRound)
// This slice has no dedicated state properties
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface DebtAndEliminationSliceState {
  // No dedicated state - debt data is stored in player objects
}

// Slice actions interface
export interface DebtAndEliminationSliceActions {
  createDebt: (debtorId: string, creditorId: string, amount: number, reason: string) => void
  checkDebtStatus: () => void
  eliminatePlayer: (playerId: string, reason: EliminationReason) => void
  checkElimination: (playerId: string) => boolean
}

// Combined slice type
export type DebtAndEliminationSlice = DebtAndEliminationSliceState & DebtAndEliminationSliceActions

// Initial state for this slice
export const initialDebtAndEliminationState: DebtAndEliminationSliceState = {
  // No state properties
}

// Slice creator with full typing
export const createDebtAndEliminationSlice: StateCreator<
  GameStore,
  [],
  [],
  DebtAndEliminationSlice
> = (set, get) => ({
  ...initialDebtAndEliminationState,

  createDebt: (debtorId, creditorId, amount, reason) => {
    const state = get()
    const debtor = state.players.find((p) => p.id === debtorId)
    if (debtor == null) return

    const debt = {
      id: `debt-${String(Date.now())}`,
      debtorId,
      creditorId,
      amount,
      createdAtRound: state.roundNumber,
      reason
    }

    get().updatePlayer(debtorId, {
      debt,
      debtCreatedAtRound: state.roundNumber
    })

    const creditorName = creditorId === 'state' ? 'the State' : state.players.find((p) => p.id === creditorId)?.name ?? 'Unknown'
    get().addLogEntry({
      type: 'payment',
      message: `${debtor.name} owes ₽${String(amount)} to ${creditorName} - ${reason}. Must pay within one round or face Gulag!`,
      playerId: debtorId
    })
  },

  checkDebtStatus: () => {
    const state = get()

    state.players.forEach((player) => {
      if (player.debt != null && player.debtCreatedAtRound !== null) {
        // Check if one full round has passed
        if ((state.roundNumber) > (player.debtCreatedAtRound) + 1) {
          // Debt default! Send to Gulag
          get().sendToGulag(player.id, 'debtDefault')

          // Clear debt
          get().updatePlayer(player.id, {
            debt: null,
            debtCreatedAtRound: null
          })
        }
      }
    })
  },

  eliminatePlayer: (playerId, reason) => {
    const state = get()
    const player = state.players.find((p) => p.id === playerId)
    if (player == null) return

    // Return all properties to State (with improvements removed)
    // Find all properties owned by this player (by custodianId)
    // This is more reliable than using player.properties array
    set((currentState) => ({
      properties: currentState.properties.map((prop) =>
        prop.custodianId === playerId
          ? { ...prop, custodianId: null, collectivizationLevel: 0 }
          : prop
      )
    }))

    // Update player with elimination details
    get().updatePlayer(playerId, {
      isEliminated: true,
      inGulag: false,
      properties: [],
      eliminationReason: reason,
      eliminationTurn: state.roundNumber,
      finalWealth: player.rubles,
      finalRank: player.rank,
      finalProperties: player.properties.length
    })

    // Log elimination with proper message
    const message = getEliminationMessage(player.name, reason)
    get().addLogEntry({
      type: 'system',
      message,
      playerId
    })

    // Check if game should end
    get().checkGameEnd()
  },

  checkElimination: (playerId) => {
    const state = get()
    const player = state.players.find(p => p.id === playerId)
    if ((player == null) || player.isEliminated || player.isStalin) return false

    // Bankruptcy check
    const totalWealth = calculateTotalWealth(player, state.properties)
    if (totalWealth < 0 && (player.debt != null)) {
      get().eliminatePlayer(playerId, 'bankruptcy')
      return true
    }

    // Red Star specific - already checked in demotePlayer

    // Gulag timeout - already checked in checkFor10TurnElimination

    return false
  }
})
