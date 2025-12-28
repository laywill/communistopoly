import type { StoreGetter, GameService } from './types'
import type { GameState } from '../types/game'

export interface TurnManager extends GameService {
  /**
   * Start the game with randomized turn order
   */
  startGame: () => void

  /**
   * Roll dice and handle movement, doubles, three-doubles-to-Gulag
   */
  rollDice: () => [number, number]

  /**
   * Roll 3 dice for Vodka Bottle ability
   */
  rollThreeDice: () => [number, number, number]

  /**
   * End current turn and advance to next player
   */
  endTurn: () => void

  /**
   * Start the current player's turn (callbacks, checks)
   */
  startTurn: () => void

  /**
   * Check if game should end
   */
  checkGameEnd: () => void

  /**
   * Get current player
   */
  getCurrentPlayer: () => ReturnType<GameState['getPlayer']>
}

export function createTurnManager (get: StoreGetter<GameState>): TurnManager {
  return {
    name: 'TurnManager',

    startGame: () => {
      const state = get()

      // Get non-Stalin, non-eliminated players
      const activePlayers = state.getActivePlayers()

      // Randomize turn order
      const turnOrder = activePlayers
        .map((p) => p.id)
        .sort(() => Math.random() - 0.5)

      state.setTurnOrder(turnOrder)
      state.setCurrentTurnIndex(0)
      state.setGamePhase('playing')
      state.setRound(1)
      state.setDoublesCount(0)

      // Shuffle card decks
      state.shufflePartyDirectiveDeck?.()

      state.addGameLogEntry('☭ The game begins! Glory to the Motherland! ☭')
    },

    rollDice: () => {
      const state = get()

      const die1 = Math.floor(Math.random() * 6) + 1
      const die2 = Math.floor(Math.random() * 6) + 1
      const roll: [number, number] = [die1, die2]

      state.setDiceRoll(roll)

      const isDoubles = die1 === die2

      if (isDoubles) {
        state.incrementDoublesCount()

        // Three doubles = Gulag
        if (state.doublesCount >= 3) {
          const currentPlayer = state.getCurrentPlayer?.() ??
            state.players.find(p => p.id === state.turnOrder[state.currentTurnIndex])

          if (currentPlayer) {
            state.addGameLogEntry(
              `${currentPlayer.name} rolled three doubles! Counter-revolutionary dice manipulation!`
            )
            state.sendToGulag?.(
              currentPlayer.id,
              'threeDoubles',
              'Rolled three consecutive doubles'
            )
          }
          state.setDoublesCount(0)
        }
      } else {
        state.setDoublesCount(0)
      }

      return roll
    },

    rollThreeDice: () => {
      const die1 = Math.floor(Math.random() * 6) + 1
      const die2 = Math.floor(Math.random() * 6) + 1
      const die3 = Math.floor(Math.random() * 6) + 1
      return [die1, die2, die3]
    },

    startTurn: () => {
      const state = get()
      const currentPlayerId = state.getCurrentPlayerId()
      const player = state.players.find(p => p.id === currentPlayerId)

      if (!player) return

      state.addGameLogEntry(`──── ${player.name}'s Turn ────`)

      // Check voucher liability countdown
      state.checkVoucherLiability?.(player.id)

      // Increment Gulag turn if imprisoned
      if (player.inGulag) {
        state.incrementGulagTurns(player.id)
        state.addGameLogEntry(
          `${player.name} begins turn ${player.gulagTurns + 1} in the Gulag`
        )
      }

      // Bread Loaf starving check
      if (player.piece === 'breadLoaf' && player.rubles < 100) {
        state.addGameLogEntry(`${player.name} is starving! Must beg for food.`)
      }
    },

    endTurn: () => {
      const state = get()
      const [die1, die2] = state.diceRoll ?? [0, 0]
      const currentPlayer = state.players.find(
        p => p.id === state.turnOrder[state.currentTurnIndex]
      )

      // If doubles and not in Gulag, player goes again
      if (die1 === die2 && die1 > 0 && !currentPlayer?.inGulag && state.doublesCount < 3) {
        state.addGameLogEntry('Doubles! Roll again, comrade.')
        state.setDiceRoll(null)
        return // Don't advance to next player
      }

      // Reset dice for next player
      state.setDiceRoll(null)
      state.setDoublesCount(0)

      // Advance to next player
      const { turnOrder, currentTurnIndex } = state
      let nextIndex = (currentTurnIndex + 1) % turnOrder.length

      // Check for round completion
      if (nextIndex === 0) {
        state.incrementRound()
        state.resetDenouncementCounts()
      }

      // Skip eliminated players
      let attempts = 0
      while (attempts < turnOrder.length) {
        const nextPlayerId = turnOrder[nextIndex]
        const nextPlayer = state.players.find(p => p.id === nextPlayerId)

        if (nextPlayer && !nextPlayer.isEliminated) {
          break
        }

        nextIndex = (nextIndex + 1) % turnOrder.length
        attempts++

        // Check for round completion when skipping
        if (nextIndex === 0) {
          state.incrementRound()
          state.resetDenouncementCounts()
        }
      }

      state.setCurrentTurnIndex(nextIndex)
    },

    checkGameEnd: () => {
      const state = get()
      const activePlayers = state.getActivePlayers()

      if (activePlayers.length === 1) {
        // Survivor victory
        const winner = activePlayers[0]
        state.setWinner(winner.id, 'Last survivor - there are no winners, only survivors')
        state.addGameLogEntry(`🏆 ${winner.name} has survived! Glory to the survivor!`)
      } else if (activePlayers.length === 0) {
        // Stalin victory
        state.setWinner(null, 'The State wins - all comrades eliminated')
        state.addGameLogEntry('☭ The State is victorious! All comrades have been eliminated.')
      }
    },

    getCurrentPlayer: () => {
      const state = get()
      const currentPlayerId = state.getCurrentPlayerId()
      return currentPlayerId ? state.getPlayer(currentPlayerId) : undefined
    },
  }
}
