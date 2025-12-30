// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import type { StoreGetter, GameService, SlicesStore } from './types'
import type { GulagReason } from '../types/game'
import { GULAG_POSITION } from '../data/spaces'
import { demoteRank } from '../utils/rankUtils'

const REHABILITATION_COST = 500
const MIN_BRIBE_AMOUNT = 200
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
   */
  checkVoucherConsequences: (playerId: string) => void

  /**
   * Expire old vouchers (called each round)
   */
  expireVouchers: () => void

  /**
   * Submit a bribe to Stalin for Gulag release
   * @param playerId Player bribing
   * @param amount Bribe amount
   * @param reason Reason for bribe
   */
  submitBribe: (playerId: string, amount: number, reason: string) => void

  /**
   * Stalin responds to a bribe (accept or reject)
   * @param bribeId Bribe ID
   * @param accepted Whether Stalin accepts the bribe
   */
  respondToBribe: (bribeId: string, accepted: boolean) => void
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
        const newRank = demoteRank(player.rank)
        if (newRank !== player.rank) {
          state.setPlayerRank(playerId, newRank)
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
      const newRank = demoteRank(player.rank)
      if (newRank !== player.rank) {
        state.setPlayerRank(playerId, newRank)
      }

      // Add log entry
      state.addGameLogEntry(`${player.name} sent to Gulag: ${reasonText}`)

      // Check voucher consequences - voucher goes to Gulag if vouchee offends
      service.checkVoucherConsequences(playerId)

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
            const newRank = demoteRank(player.rank)
            if (newRank !== player.rank) {
              state.setPlayerRank(playerId, newRank)
            }

            state.addGameLogEntry(
              `${player.name} paid ₽${String(REHABILITATION_COST)} for rehabilitation and was released (with demotion)`
            )
          }
          break
        }

        case 'vouch': {
          // Set up pending action for voucher selection
          state.setPendingAction({
            type: 'voucher-request',
            data: { prisonerId: playerId }
          })
          state.addGameLogEntry(`${player.name} is requesting a voucher`)
          break
        }

        case 'inform': {
          // Set up pending action for player to select who to inform on
          state.setPendingAction({
            type: 'inform-on-player',
            data: { informerId: playerId }
          })
          state.addGameLogEntry(`${player.name} is attempting to inform on another player`)
          break
        }

        case 'bribe': {
          // Set up pending action for bribe submission
          state.setPendingAction({
            type: 'bribe-stalin',
            data: { playerId }
          })
          state.addGameLogEntry(`${player.name} is preparing a bribe for Stalin`)
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
      const state = get()
      const prisoner = state.getPlayer(prisonerId)
      const voucherPlayer = state.getPlayer(voucherId)

      if (!prisoner || !voucherPlayer) {
        console.warn(`GulagService.createVoucher: Player not found`)
        return
      }

      if (!prisoner.inGulag) {
        console.warn(`GulagService.createVoucher: Prisoner ${prisoner.name} not in Gulag`)
        return
      }

      // Check voucher eligibility
      if (voucherPlayer.inGulag) {
        state.addGameLogEntry(
          `${voucherPlayer.name} cannot vouch while imprisoned!`
        )
        return
      }

      if (voucherPlayer.isEliminated) {
        state.addGameLogEntry(
          `${voucherPlayer.name} cannot vouch while eliminated!`
        )
        return
      }

      if (voucherPlayer.vouchingFor !== null) {
        const currentVouchee = state.getPlayer(voucherPlayer.vouchingFor)
        state.addGameLogEntry(
          `${voucherPlayer.name} is already vouching for ${currentVouchee?.name ?? 'another player'}!`
        )
        return
      }

      // Release the prisoner
      state.setPlayerInGulag(prisonerId, false)
      state.setGulagTurns(prisonerId, 0)

      // Mark voucher as liable for 3 rounds
      const currentRound = state.currentRound
      state.setVoucher(voucherId, prisonerId, currentRound + 3)

      state.addGameLogEntry(
        `${voucherPlayer.name} vouched for ${prisoner.name} - Released from Gulag! (Voucher liable for 3 rounds)`
      )
    },

    checkVoucherConsequences: (playerId) => {
      const state = get()
      const player = state.getPlayer(playerId)

      if (!player) return

      // Find if anyone vouched for this player
      const voucher = state.players.find(
        (p) => p.vouchingFor === playerId && p.vouchedByRound !== null
      )

      if (!voucher) return

      // Check if voucher is still active (hasn't expired)
      const currentRound = state.currentRound
      if (voucher.vouchedByRound && currentRound <= voucher.vouchedByRound) {
        // Voucher consequence triggered - send voucher to Gulag
        state.addGameLogEntry(
          `${player.name} committed an offense within 3 rounds of being vouched for by ${voucher.name}`
        )

        // Clear the voucher relationship
        state.clearVoucher(voucher.id)

        // Send voucher to Gulag
        service.sendToGulag(voucher.id, 'voucherConsequence')
      }
    },

    expireVouchers: () => {
      const state = get()
      const currentRound = state.currentRound

      // Find all players with active vouchers
      const vouchersToExpire = state.players.filter(
        (p) => p.vouchingFor !== null && p.vouchedByRound !== null && currentRound > p.vouchedByRound
      )

      // Expire each voucher
      vouchersToExpire.forEach((voucher) => {
        // vouchingFor is guaranteed to be non-null by the filter above
        const voucheeId = voucher.vouchingFor
        if (!voucheeId) return

        const vouchee = state.getPlayer(voucheeId)

        if (vouchee) {
          state.addGameLogEntry(
            `${voucher.name}'s voucher for ${vouchee.name} has expired (3 rounds passed without incident)`
          )
        }

        state.clearVoucher(voucher.id)
      })
    },

    submitBribe: (playerId, amount, reason) => {
      const state = get()
      const player = state.players.find((p) => p.id === playerId)

      if (!player) {
        console.warn(`GulagService.submitBribe: Player ${playerId} not found`)
        return
      }

      // Validate minimum bribe amount
      if (amount < MIN_BRIBE_AMOUNT) {
        state.addGameLogEntry(
          `${player.name}'s bribe of ₽${String(amount)} rejected - Stalin demands at least ₽${String(MIN_BRIBE_AMOUNT)}!`
        )
        return
      }

      // Check if player has enough money
      if (player.rubles < amount) {
        state.addGameLogEntry(`${player.name} cannot afford bribe of ₽${String(amount)}`)
        return
      }

      // Deduct money immediately
      state.removeMoney(playerId, amount)
      state.addToStateTreasury(amount)

      // Create bribe request
      const randomId = Math.random().toString(36).substring(2, 11)
      const bribe = {
        id: `bribe-${String(Date.now())}-${randomId}`,
        playerId,
        amount,
        reason,
        timestamp: new Date()
      }

      state.addBribe(bribe)
      state.addGameLogEntry(
        `${player.name} submitted a bribe of ₽${String(amount)} to Stalin for ${reason}`
      )
    },

    respondToBribe: (bribeId, accepted) => {
      const state = get()
      const bribe = state.getBribe(bribeId)

      if (!bribe) {
        console.warn(`GulagService.respondToBribe: Bribe ${bribeId} not found`)
        return
      }

      const player = state.players.find((p) => p.id === bribe.playerId)

      if (!player) {
        console.warn(`GulagService.respondToBribe: Player ${bribe.playerId} not found`)
        state.removeBribe(bribeId)
        return
      }

      if (accepted) {
        // Stalin accepts - release prisoner
        state.setPlayerInGulag(bribe.playerId, false)
        state.setGulagTurns(bribe.playerId, 0)
        state.addGameLogEntry(
          `Stalin accepted ${player.name}'s bribe of ₽${String(bribe.amount)} - Released from Gulag!`
        )
      } else {
        // Stalin rejects - money already taken, prisoner stays
        state.addGameLogEntry(
          `Stalin rejected ${player.name}'s bribe of ₽${String(bribe.amount)} - Money confiscated, prisoner remains in Gulag`
        )
      }

      // Remove bribe from pending
      state.removeBribe(bribeId)
    }
  }

  return service
}
