// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import type { StoreGetter, GameService, SlicesStore } from './types'
import type { GulagReason, PartyRank } from '../types/game'

const GULAG_POSITION = 10
const REHABILITATION_COST = 500
const RAILWAY_POSITIONS = [5, 15, 25, 35]

export interface GulagService extends GameService {
  /**
   * Send a player to the Gulag with full rule processing.
   * Handles: piece immunities, rank demotion, Red Star elimination, logging
   * @returns true if sent to Gulag or eliminated, false if blocked by immunity
   */
  sendToGulag: (playerId: string, reason: GulagReason, justification?: string) => boolean

  /**
   * Handle a player's Gulag turn (increment counter, check for elimination)
   */
  handleGulagTurn: (playerId: string) => void

  /**
   * Check if player should be eliminated after 10 turns
   */
  checkFor10TurnElimination: (playerId: string) => void

  /**
   * Attempt escape by rolling dice.
   * @param playerId Player ID
   * @param method Escape method ('roll', 'pay', 'vouch', 'inform', 'bribe', 'card')
   * @param data Optional data for escape attempt
   */
  attemptGulagEscape: (playerId: string, method: string, data?: unknown) => void

  /**
   * Create a voucher agreement (another player vouches for prisoner)
   * @param prisonerId Player in Gulag
   * @param voucherId Player vouching
   */
  createVoucher: (prisonerId: string, voucherId: string) => void

  /**
   * Check if voucher should trigger consequence when vouchee commits offense
   * @param playerId Player committing offense
   * @param reason Reason for Gulag entry
   */
  checkVoucherConsequences: (playerId: string, reason: GulagReason) => void

  /**
   * Expire old vouchers (called each round)
   */
  expireVouchers: () => void
}

/**
 * Helper: Find nearest railway station from current position
 */
function findNearestRailway(position: number): number {
  let nearestRailway = RAILWAY_POSITIONS[0]
  let minDistance = Math.abs(position - RAILWAY_POSITIONS[0])

  RAILWAY_POSITIONS.forEach(railPos => {
    const distance = Math.abs(position - railPos)
    if (distance < minDistance) {
      minDistance = distance
      nearestRailway = railPos
    }
  })

  return nearestRailway
}

/**
 * Helper: Format Gulag reason for display
 */
function formatGulagReason(reason: GulagReason, justification?: string): string {
  const reasons: Record<GulagReason, string> = {
    enemyOfState: 'Landed on Enemy of the State',
    threeDoubles: 'Rolled three consecutive doubles - counter-revolutionary dice behavior',
    denouncementGuilty: 'Found guilty in tribunal',
    debtDefault: 'Failed to pay debt within one round',
    pilferingCaught: 'Caught stealing at STOY checkpoint',
    stalinDecree: justification ?? 'Sent by Stalin',
    railwayCapture: 'Caught attempting to flee the motherland via railway',
    campLabour: 'Sent for forced labour by Siberian Camp custodian',
    voucherConsequence: 'Voucher consequence - vouchee committed an offence'
  }
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return reasons[reason] ?? reason
}

// Removed: shouldTriggerVoucherConsequence - no longer needed since voucher system not implemented

export function createGulagService(get: StoreGetter<SlicesStore>): GulagService {
  // Helper function to get required doubles for escape based on turns in Gulag
  const getRequiredDoublesForEscape = (turnsInGulag: number): number[] => {
    if (turnsInGulag === 1) return [6] // Only double 6s
    if (turnsInGulag === 2) return [5, 6] // Double 5s or 6s
    if (turnsInGulag === 3) return [4, 5, 6] // Double 4s, 5s, or 6s
    if (turnsInGulag === 4) return [3, 4, 5, 6] // Double 3s, 4s, 5s, or 6s
    return [1, 2, 3, 4, 5, 6] // Any doubles (turn 5+)
  }

  // Helper function to check if roll is valid for escape
  const isValidEscapeRoll = (turnsInGulag: number, dice: [number, number]): boolean => {
    if (dice[0] !== dice[1]) return false // Must be doubles

    const requiredDoubles = getRequiredDoublesForEscape(turnsInGulag)
    return requiredDoubles.includes(dice[0])
  }

  const service: GulagService = {
    name: 'GulagService',

    sendToGulag: (playerId, reason, justification) => {
      const state = get()
      const player = state.players.find((p) => p.id === playerId)

      if (player == null) {
        console.warn(`GulagService.sendToGulag: Player ${playerId} not found`)
        return false
      }

      if (player.inGulag) {
        console.warn(`GulagService.sendToGulag: Player ${player.name} already in Gulag`)
        return false
      }

      // === PIECE IMMUNITY CHECKS ===

      // HAMMER: Cannot be sent by other players (denouncement or three doubles)
      if (player.piece === 'hammer' && (reason === 'denouncementGuilty' || reason === 'threeDoubles')) {
        state.addGameLogEntry(
          `${player.name}'s Hammer protects them from Gulag! (Player-initiated imprisonment blocked)`
        )
        // TODO: Turn phase system not implemented in new architecture yet
        return false
      }

      // TANK: First time immunity - redirect to railway
      if (player.piece === 'tank' && !player.hasUsedTankGulagImmunity) {
        const nearestRailway = findNearestRailway(player.position)

        // Mark immunity as used and move to railway
        state.markTankImmunityUsed(playerId)
        state.setPlayerPosition(playerId, nearestRailway)

        state.addGameLogEntry(
          `${player.name}'s Tank evades Gulag! Redirected to nearest Railway Station (immunity used)`
        )

        // Still demote player (loses rank but avoids Gulag)
        const ranks: PartyRank[] = ['proletariat', 'partyMember', 'commissar', 'innerCircle']
        const currentIdx = ranks.indexOf(player.rank)
        if (currentIdx > 0 && currentIdx <= ranks.length - 1) {
           
          state.setPlayerRank(playerId, ranks[currentIdx - 1])
        }

        // TODO: Turn phase system not implemented in new architecture yet
        return false
      }

      // === PROCESS GULAG ENTRY ===

      const reasonText = formatGulagReason(reason, justification)

      // Update player state
      state.setPlayerInGulag(playerId, true)
      state.setGulagTurns(playerId, 0)
      state.setPlayerPosition(playerId, GULAG_POSITION)

      // Demote player
      const ranks: PartyRank[] = ['proletariat', 'partyMember', 'commissar', 'innerCircle']
      const currentIdx = ranks.indexOf(player.rank)
      if (currentIdx > 0 && currentIdx <= ranks.length - 1) {
         
        state.setPlayerRank(playerId, ranks[currentIdx - 1])
      }

      // Add log entry
      state.addGameLogEntry(`${player.name} sent to Gulag: ${reasonText}`)

      // TODO: Voucher system not implemented in new architecture yet
      // if (shouldTriggerVoucherConsequence(reason)) {
      //   service.checkVoucherConsequences(playerId, reason)
      // }

      return true
    },

    handleGulagTurn: (playerId) => {
      const state = get()
      const player = state.players.find((p) => p.id === playerId)

      if (!player?.inGulag) return

      // Increment Gulag turns
      state.incrementGulagTurns(playerId)

      // Check for 10-turn elimination
      service.checkFor10TurnElimination(playerId)

      // TODO: Pending actions not implemented in new architecture yet
      // Set pending action for escape choice
    },

    checkFor10TurnElimination: (playerId) => {
      const state = get()
      const player = state.players.find((p) => p.id === playerId)

      if (!player?.inGulag) return
      if (player.gulagTurns < 10) return

      // Eliminate player
      state.eliminatePlayer(playerId, 'Perished in Gulag after 10 turns')
    },

    attemptGulagEscape: (playerId, method) => {
      const state = get()
      const player = state.players.find((p) => p.id === playerId)

      if (!player?.inGulag) return

      switch (method) {
        case 'roll': {
          // Check if dice match requirements
          const dice = state.diceRoll
          if (!dice) break

          const isValid = isValidEscapeRoll(player.gulagTurns, dice)

          if (isValid) {
            // Success! Escape the Gulag
            state.setPlayerInGulag(playerId, false)
            state.setGulagTurns(playerId, 0)
            state.addGameLogEntry(`${player.name} rolled double ${String(dice[0])}s and escaped the Gulag!`)
          } else {
            // Failed escape
            state.addGameLogEntry(`${player.name} failed to escape the Gulag`)
          }
          break
        }

        case 'pay': {
          // Pay 500₽ and lose one rank
          if (player.rubles >= REHABILITATION_COST) {
            state.removeMoney(playerId, REHABILITATION_COST)
            state.addToStateTreasury(REHABILITATION_COST)
            state.setPlayerInGulag(playerId, false)
            state.setGulagTurns(playerId, 0)

            // Demote player
            const ranks: PartyRank[] = ['proletariat', 'partyMember', 'commissar', 'innerCircle']
            const currentIdx = ranks.indexOf(player.rank)
            if (currentIdx > 0 && currentIdx <= ranks.length - 1) {
               
              state.setPlayerRank(playerId, ranks[currentIdx - 1])
            }

            state.addGameLogEntry(
              `${player.name} paid ₽${String(REHABILITATION_COST)} for rehabilitation and was released (with demotion)`
            )
          }
          break
        }

        case 'vouch': {
          // TODO: Voucher system not implemented in new architecture yet
          // Would set up voucher request via pending action
          state.addGameLogEntry(`${player.name} requested voucher (not yet implemented)`)
          break
        }

        case 'inform': {
          // TODO: Inform system not implemented in new architecture yet
          // Would set up inform modal via pending action
          state.addGameLogEntry(`${player.name} attempted to inform (not yet implemented)`)
          break
        }

        case 'bribe': {
          // TODO: Bribe system not implemented in new architecture yet
          // Would set up bribe modal via pending action
          state.addGameLogEntry(`${player.name} attempted bribe (not yet implemented)`)
          break
        }

        case 'card': {
          // Use "Get out of Gulag free" card
          if (player.hasFreeFromGulagCard) {
            state.setPlayerInGulag(playerId, false)
            state.setGulagTurns(playerId, 0)
            state.updatePlayer(playerId, { hasFreeFromGulagCard: false })

            state.addGameLogEntry(
              `${player.name} used "Get out of Gulag free" card and was immediately released!`
            )
            // TODO: Turn phase system not implemented in new architecture yet
          }
          break
        }
      }
    },

    createVoucher: (prisonerId, voucherId) => {
      // TODO: Voucher system not implemented in new architecture yet
      // This would require:
      // - activeVouchers state array in GulagSlice
      // - vouchingFor field in Player type
      // - vouchedByRound field in Player type
      const state = get()
      const prisoner = state.getPlayer(prisonerId)
      const voucherPlayer = state.getPlayer(voucherId)

      if (!prisoner || !voucherPlayer) return

      state.addGameLogEntry(
        `Voucher system not implemented: ${voucherPlayer.name} would vouch for ${prisoner.name}`
      )
    },

    checkVoucherConsequences: (playerId, reason) => {
      // TODO: Voucher system not implemented in new architecture yet
      // This would check if playerId has an active voucher and send voucher to Gulag
      // Stub for now - no-op
      void playerId
      void reason
    },

    expireVouchers: () => {
      // TODO: Voucher system not implemented in new architecture yet
      // This would iterate through activeVouchers and expire old ones
      // Stub for now - no-op
    }
  }

  return service
}
