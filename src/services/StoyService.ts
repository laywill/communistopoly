// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import type { StoreGetter, GameService, SlicesStore } from './types'
import type { GulagService } from './GulagService'

const TRAVEL_TAX = 200

export interface StoyService extends GameService {
  /**
   * Handle player passing through STOY (travel tax)
   */
  handlePassingStoy: (playerId: string) => void

  /**
   * Handle player landing exactly on STOY (pilfer attempt)
   */
  handleLandingOnStoy: (playerId: string) => { success: boolean, amount: number }
}

export function createStoyService (
  get: StoreGetter<SlicesStore>,
  gulagService: GulagService
): StoyService {
  return {
    name: 'StoyService',

    handlePassingStoy: (playerId) => {
      const state = get()
      const player = state.getPlayer(playerId)

      if (!player) return

      const tax = TRAVEL_TAX
      let bonus = 0

      // Hammer piece: +50₽ when passing Stoy
      if (player.piece === 'hammer') {
        bonus = 50
      }

      // Deduct tax
      state.removeMoney(playerId, tax)
      state.addToStateTreasury(tax)

      // Add Hammer bonus
      if (bonus > 0) {
        state.addMoney(playerId, bonus)
      }

      const netCost = tax - bonus
      const playerName = player.name
      state.addGameLogEntry(
        bonus > 0
          ? `${playerName} passed STOY: paid ${String(tax)}₽ tax, received ${String(bonus)}₽ bonus (net: ${String(netCost)}₽)`
          : `${playerName} passed STOY: paid ${String(tax)}₽ travel tax`
      )
    },

    handleLandingOnStoy: (playerId) => {
      const state = get()
      const player = state.getPlayer(playerId)

      if (!player) return { success: false, amount: 0 }

      // Roll for pilfer attempt
      const pilferRoll = Math.floor(Math.random() * 6) + 1
      const playerName = player.name

      if (pilferRoll >= 4) {
        // Success: Steal 100₽ from State
        const amount = 100
        const stolen = state.removeFromStateTreasury(amount)

        if (stolen) {
          state.addMoney(playerId, amount)
          state.addGameLogEntry(
            `${playerName} landed on STOY and successfully pilfered ${String(amount)}₽! (rolled ${String(pilferRoll)})`
          )
          return { success: true, amount }
        } else {
          state.addGameLogEntry(
            `${playerName} tried to pilfer but the State coffers are empty!`
          )
          return { success: false, amount: 0 }
        }
      } else {
        // Failed: Caught, sent to Gulag
        state.addGameLogEntry(
          `${playerName} was caught attempting to pilfer! (rolled ${String(pilferRoll)})`
        )

        // Use GulagService to send to Gulag
        gulagService.sendToGulag(playerId, 'pilferingCaught')
        return { success: false, amount: 0 }
      }
    },
  }
}
