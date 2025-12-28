import type { StoreGetter, GameService } from './types'
import type { GameState } from '../types/game'

const STOY_POSITION = 0 // GO equivalent
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

export function createStoyService (get: StoreGetter<GameState>): StoyService {
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
      state.addGameLogEntry(
        bonus > 0
          ? `${player.name} passed STOY: paid ${tax}₽ tax, received ${bonus}₽ bonus (net: ${netCost}₽)`
          : `${player.name} passed STOY: paid ${tax}₽ travel tax`
      )
    },

    handleLandingOnStoy: (playerId) => {
      const state = get()
      const player = state.getPlayer(playerId)

      if (!player) return { success: false, amount: 0 }

      // Roll for pilfer attempt
      const pilferRoll = Math.floor(Math.random() * 6) + 1

      if (pilferRoll >= 4) {
        // Success: Steal 100₽ from State
        const amount = 100
        const stolen = state.removeFromStateTreasury(amount)

        if (stolen) {
          state.addMoney(playerId, amount)
          state.addGameLogEntry(
            `${player.name} landed on STOY and successfully pilfered ${amount}₽! (rolled ${pilferRoll})`
          )
          return { success: true, amount }
        } else {
          state.addGameLogEntry(
            `${player.name} tried to pilfer but the State coffers are empty!`
          )
          return { success: false, amount: 0 }
        }
      } else {
        // Failed: Caught, sent to Gulag
        state.addGameLogEntry(
          `${player.name} was caught attempting to pilfer! (rolled ${pilferRoll})`
        )
        state.sendToGulag?.(playerId, 'stalinDecree', 'Caught pilfering at STOY checkpoint')
        return { success: false, amount: 0 }
      }
    },
  }
}
