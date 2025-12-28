import type { StoreGetter, GameService } from './types'
import type { GameState } from '../types/game'

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
      const player = state.getPlayer?.(playerId)

      if (!player) return

      const tax = TRAVEL_TAX
      let bonus = 0

      // Hammer piece: +50₽ when passing Stoy
      if (player.piece === 'hammer') {
        bonus = 50
      }

      // Deduct tax
      const removeMoney = state.removeMoney
      const addToTreasury = state.addToStateTreasury
      const addMoney = state.addMoney
      const addLog = state.addGameLogEntry

      if (removeMoney) removeMoney(playerId, tax)
      if (addToTreasury) addToTreasury(tax)

      // Add Hammer bonus
      if (bonus > 0 && addMoney) {
        addMoney(playerId, bonus)
      }

      const netCost = tax - bonus
      const playerName = player.name
      if (addLog) {
        addLog(
          bonus > 0
            ? `${playerName} passed STOY: paid ${String(tax)}₽ tax, received ${String(bonus)}₽ bonus (net: ${String(netCost)}₽)`
            : `${playerName} passed STOY: paid ${String(tax)}₽ travel tax`
        )
      }
    },

    handleLandingOnStoy: (playerId) => {
      const state = get()
      const player = state.getPlayer?.(playerId)

      if (!player) return { success: false, amount: 0 }

      // Roll for pilfer attempt
      const pilferRoll = Math.floor(Math.random() * 6) + 1
      const playerName = player.name

      if (pilferRoll >= 4) {
        // Success: Steal 100₽ from State
        const amount = 100
        const removeFromTreasury = state.removeFromStateTreasury
        const stolen = removeFromTreasury ? removeFromTreasury(amount) : false

        if (stolen) {
          const addMoney = state.addMoney
          const addLog = state.addGameLogEntry
          if (addMoney) addMoney(playerId, amount)
          if (addLog) {
            addLog(
              `${playerName} landed on STOY and successfully pilfered ${String(amount)}₽! (rolled ${String(pilferRoll)})`
            )
          }
          return { success: true, amount }
        } else {
          const addLog = state.addGameLogEntry
          if (addLog) {
            addLog(
              `${playerName} tried to pilfer but the State coffers are empty!`
            )
          }
          return { success: false, amount: 0 }
        }
      } else {
        // Failed: Caught, sent to Gulag
        const addLog = state.addGameLogEntry
        const sendToGulag = state.sendToGulag
        if (addLog) {
          addLog(
            `${playerName} was caught attempting to pilfer! (rolled ${String(pilferRoll)})`
          )
        }
        if (sendToGulag) sendToGulag(playerId, 'stalinDecree', 'Caught pilfering at STOY checkpoint')
        return { success: false, amount: 0 }
      }
    },
  }
}
