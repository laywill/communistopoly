// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import type { StoreGetter, GameService, SlicesStore } from './types'
import type { GulagReason } from '../types/game'

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

/**
 * Helper: Check if a reason should trigger voucher consequences
 */
function shouldTriggerVoucherConsequence(reason: GulagReason): boolean {
  const triggeringReasons: GulagReason[] = [
    'enemyOfState',
    'threeDoubles',
    'denouncementGuilty',
    'pilferingCaught',
    'stalinDecree',
    'railwayCapture',
    'campLabour'
  ]
  return triggeringReasons.includes(reason)
}

export function createGulagService(get: StoreGetter<SlicesStore>): GulagService {
  return {
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
        if ('addLogEntry' in state && typeof state.addLogEntry === 'function') {
          (state.addLogEntry as (entry: { type: string, message: string, playerId?: string }) => void)({
            type: 'system',
            message: `${player.name}'s Hammer protects them from Gulag! (Player-initiated imprisonment blocked)`,
            playerId
          })
        }

        if ('set' in state) {
          const setState = state as unknown as { set: (update: Partial<GameState>) => void }
          setState.set({ turnPhase: 'post-turn' })
        }
        return false
      }

      // TANK: First time immunity - redirect to railway
      if (player.piece === 'tank' && !player.hasUsedTankGulagImmunity) {
        const nearestRailway = findNearestRailway(player.position)

        // Update tank immunity and position
        if ('updatePlayer' in state && typeof state.updatePlayer === 'function') {
          (state.updatePlayer as (id: string, updates: Partial<typeof player>) => void)(playerId, {
            position: nearestRailway,
            hasUsedTankGulagImmunity: true
          })
        }

        if ('addLogEntry' in state && typeof state.addLogEntry === 'function') {
          (state.addLogEntry as (entry: { type: string, message: string, playerId?: string }) => void)({
            type: 'system',
            message: `${player.name}'s Tank evades Gulag! Redirected to nearest Railway Station (immunity used)`,
            playerId
          })
        }

        // Still demote player (loses rank but avoids Gulag)
        if ('demotePlayer' in state && typeof state.demotePlayer === 'function') {
          (state.demotePlayer as (id: string) => void)(playerId)
        }

        if ('set' in state) {
          const setState = state as unknown as { set: (update: Partial<GameState>) => void }
          setState.set({ turnPhase: 'post-turn' })
        }
        return false
      }

      // === PROCESS GULAG ENTRY ===

      const reasonText = formatGulagReason(reason, justification)

      // Update player state via updatePlayer (which exists in gameStore)
      if ('updatePlayer' in state && typeof state.updatePlayer === 'function') {
        (state.updatePlayer as (id: string, updates: Partial<typeof player>) => void)(playerId, {
          inGulag: true,
          gulagTurns: 0,
          position: GULAG_POSITION
        })
      }

      // Demote player
      if ('demotePlayer' in state && typeof state.demotePlayer === 'function') {
        (state.demotePlayer as (id: string) => void)(playerId)
      }

      // Add log entry
      if ('addLogEntry' in state && typeof state.addLogEntry === 'function') {
        (state.addLogEntry as (entry: { type: string, message: string, playerId?: string }) => void)({
          type: 'gulag',
          message: `${player.name} sent to Gulag: ${reasonText}`,
          playerId
        })
      }

      // Check voucher consequences if applicable
      if (shouldTriggerVoucherConsequence(reason)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (get() as any).checkVoucherConsequences(playerId, reason)
      }

      // End turn immediately
      if ('set' in state) {
        const setState = state as unknown as { set: (update: Partial<GameState>) => void }
        setState.set({ turnPhase: 'post-turn' })
      }

      return true
    },

    handleGulagTurn: (playerId) => {
      const state = get()
      const player = state.players.find((p) => p.id === playerId)

      if (!player?.inGulag) return

      // Increment Gulag turns
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (state as any).incrementGulagTurns(playerId);

      // Check for 10-turn elimination
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (get() as any).checkFor10TurnElimination(playerId)

      // Set pending action for escape choice
      if ('set' in state) {
        const setState = state as unknown as { set: (update: Partial<GameState>) => void }
        setState.set({ pendingAction: { type: 'gulag-escape-choice', data: { playerId } } })
      }
    },

    checkFor10TurnElimination: (playerId) => {
      const state = get()
      const player = state.players.find((p) => p.id === playerId)

      if (!player?.inGulag) return
      if (player.gulagTurns < 10) return

      // Eliminate player
      if ('eliminatePlayer' in state && typeof state.eliminatePlayer === 'function') {
        (state.eliminatePlayer as (id: string, reason: string) => void)(
          playerId,
          'Perished in Gulag after 10 turns'
        )
      }
    },

    attemptGulagEscape: (playerId, method) => {
      const state = get()
      const player = state.players.find((p) => p.id === playerId)

      if (!player?.inGulag) return

      switch (method) {
        case 'roll': {
          // Check if dice match requirements
          const dice = state.dice
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const isValid = (state as any).isValidEscapeRoll(player.gulagTurns, [dice[0], dice[1]])

          if (isValid) {
            // Success! Escape the Gulag
            if ('updatePlayer' in state && typeof state.updatePlayer === 'function') {
              (state.updatePlayer as (id: string, updates: Partial<typeof player>) => void)(playerId, {
                inGulag: false,
                gulagTurns: 0
              })
            }

            if ('addLogEntry' in state && typeof state.addLogEntry === 'function') {
              (state.addLogEntry as (entry: { type: string, message: string, playerId?: string }) => void)({
                type: 'gulag',
                message: `${player.name} rolled double ${String(dice[0])}s and escaped the Gulag!`,
                playerId
              })
            }

            if ('set' in state) {
              const setState = state as unknown as { set: (update: Partial<GameState>) => void }
              setState.set({ turnPhase: 'post-turn', pendingAction: null })
            }
          } else {
            // Failed escape
            if ('addLogEntry' in state && typeof state.addLogEntry === 'function') {
              (state.addLogEntry as (entry: { type: string, message: string, playerId?: string }) => void)({
                type: 'gulag',
                message: `${player.name} failed to escape the Gulag`,
                playerId
              })
            }

            if ('set' in state) {
              const setState = state as unknown as { set: (update: Partial<GameState>) => void }
              setState.set({ turnPhase: 'post-turn', pendingAction: null })
            }
          }
          break
        }

        case 'pay': {
          // Pay 500₽ and lose one rank
          if (player.rubles >= REHABILITATION_COST) {
            if ('updatePlayer' in state && typeof state.updatePlayer === 'function') {
              (state.updatePlayer as (id: string, updates: Partial<typeof player>) => void)(playerId, {
                rubles: player.rubles - REHABILITATION_COST,
                inGulag: false,
                gulagTurns: 0
              })
            }

            if ('adjustTreasury' in state && typeof state.adjustTreasury === 'function') {
              (state.adjustTreasury as (amount: number) => void)(REHABILITATION_COST)
            }

            if ('demotePlayer' in state && typeof state.demotePlayer === 'function') {
              (state.demotePlayer as (id: string) => void)(playerId)
            }

            if ('addLogEntry' in state && typeof state.addLogEntry === 'function') {
              (state.addLogEntry as (entry: { type: string, message: string, playerId?: string }) => void)({
                type: 'gulag',
                message: `${player.name} paid ₽${String(REHABILITATION_COST)} for rehabilitation and was released (with demotion)`,
                playerId
              })
            }

            if ('set' in state) {
              const setState = state as unknown as { set: (update: Partial<GameState>) => void }
              setState.set({ turnPhase: 'post-turn', pendingAction: null })
            }
          }
          break
        }

        case 'vouch': {
          // Set up voucher request
          if ('set' in state) {
            const setState = state as unknown as { set: (update: Partial<GameState>) => void }
            setState.set({ pendingAction: { type: 'voucher-request', data: { prisonerId: playerId } } })
          }
          break
        }

        case 'inform': {
          // Set up inform modal
          if ('set' in state) {
            const setState = state as unknown as { set: (update: Partial<GameState>) => void }
            setState.set({ pendingAction: { type: 'inform-on-player', data: { informerId: playerId } } })
          }
          break
        }

        case 'bribe': {
          // Set up bribe modal
          if ('set' in state) {
            const setState = state as unknown as { set: (update: Partial<GameState>) => void }
            setState.set({ pendingAction: { type: 'bribe-stalin', data: { playerId, reason: 'gulag-escape' } } })
          }
          break
        }

        case 'card': {
          // Use "Get out of Gulag free" card
          if (player.hasFreeFromGulagCard) {
            if ('updatePlayer' in state && typeof state.updatePlayer === 'function') {
              (state.updatePlayer as (id: string, updates: Partial<typeof player>) => void)(playerId, {
                inGulag: false,
                gulagTurns: 0,
                hasFreeFromGulagCard: false
              })
            }

            if ('addLogEntry' in state && typeof state.addLogEntry === 'function') {
              (state.addLogEntry as (entry: { type: string, message: string, playerId?: string }) => void)({
                type: 'gulag',
                message: `${player.name} used "Get out of Gulag free" card and was immediately released!`,
                playerId
              })
            }

            if ('set' in state) {
              const setState = state as unknown as { set: (update: Partial<GameState>) => void }
              setState.set({ turnPhase: 'post-turn', pendingAction: null })
            }
          }
          break
        }
      }
    },

    createVoucher: (prisonerId, voucherId) => {
      const state = get()
      const prisoner = state.players.find((p) => p.id === prisonerId)
      const voucherPlayer = state.players.find((p) => p.id === voucherId)

      if (prisoner == null || voucherPlayer == null) return

      const expiresAtRound = state.roundNumber + 3

      // Release prisoner immediately
      if ('updatePlayer' in state && typeof state.updatePlayer === 'function') {
        (state.updatePlayer as (id: string, updates: Partial<typeof prisoner>) => void)(prisonerId, {
          inGulag: false,
          gulagTurns: 0
        })
      }

      // Update voucher's state
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (state as any).setVoucher(voucherId, prisonerId, expiresAtRound)

      // Add voucher to active vouchers list
      if ('set' in state) {
        const setState = state as unknown as { set: (update: (prev: GameState) => Partial<GameState>) => void }
        setState.set((prev) => ({
          activeVouchers: [...prev.activeVouchers, {
            id: `voucher-${String(Date.now())}`,
            prisonerId,
            voucherId,
            expiresAtRound,
            isActive: true
          }],
          pendingAction: null
        }))
      }

      if ('addLogEntry' in state && typeof state.addLogEntry === 'function') {
        (state.addLogEntry as (entry: { type: string, message: string }) => void)({
          type: 'gulag',
          message: `${voucherPlayer.name} vouched for ${prisoner.name}'s release. WARNING: If ${prisoner.name} commits ANY offence in the next 3 rounds, ${voucherPlayer.name} goes to Gulag too!`
        })
      }

      if ('set' in state) {
        const setState = state as unknown as { set: (update: Partial<GameState>) => void }
        setState.set({ turnPhase: 'post-turn' })
      }
    },

    checkVoucherConsequences: (playerId, reason) => {
      const state = get()

      // Only certain reasons trigger voucher consequences
      if (!shouldTriggerVoucherConsequence(reason)) return

      // Find active voucher where this player is the prisoner
      const activeVoucher = state.activeVouchers.find(
        (v) => v.prisonerId === playerId && v.isActive && state.roundNumber <= v.expiresAtRound
      )

      if (activeVoucher == null) return

      const voucherPlayer = state.players.find((p) => p.id === activeVoucher.voucherId)
      const prisoner = state.players.find((p) => p.id === playerId)

      if (voucherPlayer == null || prisoner == null) return

      // Send voucher to Gulag with voucherConsequence reason
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (get() as any).sendToGulag(activeVoucher.voucherId, 'voucherConsequence')

      // Deactivate voucher
      if ('set' in state) {
        const setState = state as unknown as { set: (update: (prev: GameState) => Partial<GameState>) => void }
        setState.set((prev) => ({
          activeVouchers: prev.activeVouchers.map((v) =>
            v.id === activeVoucher.id ? { ...v, isActive: false } : v
          )
        }))
      }

      if ('addLogEntry' in state && typeof state.addLogEntry === 'function') {
        (state.addLogEntry as (entry: { type: string, message: string }) => void)({
          type: 'gulag',
          message: `${voucherPlayer.name} sent to Gulag - voucher liability triggered by ${prisoner.name}'s offense!`
        })
      }
    },

    expireVouchers: () => {
      const state = get()
      const currentRound = state.roundNumber

      // Find expired vouchers
      const expiredVouchers = state.activeVouchers.filter(
        (v) => v.isActive && currentRound > v.expiresAtRound
      )

      if (expiredVouchers.length === 0) return

      // Clear voucher state for expired vouchers
      expiredVouchers.forEach((voucher) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (state as any).clearVoucher(voucher.voucherId)

        const voucherPlayer = state.players.find((p) => p.id === voucher.voucherId)
        const prisoner = state.players.find((p) => p.id === voucher.prisonerId)

        if (voucherPlayer && prisoner && 'addLogEntry' in state && typeof state.addLogEntry === 'function') {
          (state.addLogEntry as (entry: { type: string, message: string }) => void)({
            type: 'system',
            message: `${voucherPlayer.name}'s voucher for ${prisoner.name} has expired - liability lifted!`
          })
        }
      })

      // Remove expired vouchers from active list
      if ('set' in state) {
        const setState = state as unknown as { set: (update: (prev: GameState) => Partial<GameState>) => void }
        setState.set((prev) => ({
          activeVouchers: prev.activeVouchers.map((v) =>
            expiredVouchers.some((ev) => ev.id === v.id)
              ? { ...v, isActive: false }
              : v
          )
        }))
      }
    }
  }
}
