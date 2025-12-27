// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { StateCreator } from 'zustand'
import type {
  GulagReason,
  GulagEscapeMethod,
  VoucherAgreement,
  BribeRequest
} from '../../types/game'

// Helper functions
function getGulagReasonText (reason: GulagReason, justification?: string): string {
  const reasonTexts: Record<GulagReason, string> = {
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

  return reasonTexts[reason]
}

function getRequiredDoublesForEscape (turnsInGulag: number): number[] {
  switch (turnsInGulag) {
    case 1:
      return [6]
    case 2:
      return [5, 6]
    case 3:
      return [4, 5, 6]
    case 4:
      return [3, 4, 5, 6]
    default:
      return [1, 2, 3, 4, 5, 6] // Any doubles after turn 5
  }
}

function shouldTriggerVoucherConsequence (reason: GulagReason): boolean {
  // These reasons trigger voucher consequences
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

// State interface
export interface GulagSliceState {
  activeVouchers: VoucherAgreement[]
  pendingBribes: BribeRequest[]
}

// Actions interface
export interface GulagSliceActions {
  sendToGulag: (playerId: string, reason: GulagReason, justification?: string) => void
  handleGulagTurn: (playerId: string) => void
  checkFor10TurnElimination: (playerId: string) => void
  attemptGulagEscape: (playerId: string, method: GulagEscapeMethod, data?: Record<string, unknown>) => void
  createVoucher: (prisonerId: string, voucherId: string) => void
  checkVoucherConsequences: (playerId: string, reason: GulagReason) => void
  expireVouchers: () => void
  submitBribe: (playerId: string, amount: number, reason: string) => void
  respondToBribe: (bribeId: string, accepted: boolean) => void
  siberianCampsGulag: (custodianId: string, targetPlayerId: string) => void
}

// Combined slice type
export type GulagSlice = GulagSliceState & GulagSliceActions

// Initial state
const initialGulagState: GulagSliceState = {
  activeVouchers: [],
  pendingBribes: []
}

// Slice creator
// Note: This slice depends on other store functions (updatePlayer, demotePlayer, addLogEntry, etc.)
// which are accessed via get() from the combined store
export const createGulagSlice: StateCreator<
  GulagSlice,
  [],
  [],
  GulagSlice
> = (set, get) => ({
  ...initialGulagState,

  sendToGulag: (playerId, reason, justification) => {
    const state = get() as any
    const player = state.players?.find((p: any) => p.id === playerId)
    if (player == null) return

    // HAMMER ABILITY: Cannot be sent to Gulag by other players
    // Blocked reasons: denouncementGuilty, threeDoubles
    if (player.piece === 'hammer' && (reason === 'denouncementGuilty' || reason === 'threeDoubles')) {
      state.addLogEntry?.({
        type: 'system',
        message: `${player.name}'s Hammer protects them from Gulag! (Player-initiated imprisonment blocked)`,
        playerId
      })
      set({ turnPhase: 'post-turn' } as any)
      return
    }

    // TANK ABILITY: Immune to first Gulag sentence (return to nearest Railway Station instead)
    if (player.piece === 'tank' && !player.hasUsedTankGulagImmunity) {
      const railwayPositions = [5, 15, 25, 35]
      const currentPos = player.position

      // Find nearest railway station
      let nearestRailway = railwayPositions[0]
      let minDistance = Math.abs(currentPos - railwayPositions[0])

      railwayPositions.forEach(railPos => {
        const distance = Math.abs(currentPos - railPos)
        if (distance < minDistance) {
          minDistance = distance
          nearestRailway = railPos
        }
      })

      state.updatePlayer?.(playerId, {
        position: nearestRailway,
        hasUsedTankGulagImmunity: true
      })

      state.addLogEntry?.({
        type: 'system',
        message: `${player.name}'s Tank evades Gulag! Redirected to nearest Railway Station (immunity used)`,
        playerId
      })

      // Still demote player (loses rank but avoids Gulag)
      state.demotePlayer?.(playerId)

      set({ turnPhase: 'post-turn' } as any)
      return
    }

    const reasonText = getGulagReasonText(reason, justification)

    state.updatePlayer?.(playerId, {
      inGulag: true,
      gulagTurns: 0,
      position: 10 // Gulag position
    })

    // Demote player
    state.demotePlayer?.(playerId)

    state.addLogEntry?.({
      type: 'gulag',
      message: `${player.name} sent to Gulag: ${reasonText}`,
      playerId
    })

    // Check voucher consequences if applicable
    get().checkVoucherConsequences(playerId, reason)

    // End turn immediately
    set({ turnPhase: 'post-turn' } as any)
  },

  handleGulagTurn: (playerId) => {
    const state = get() as any
    const player = state.players?.find((p: any) => p.id === playerId)
    if (!player?.inGulag) return

    // Increment turn counter
    const newGulagTurns: number = (player.gulagTurns) + 1
    state.updatePlayer?.(playerId, { gulagTurns: newGulagTurns })

    state.addLogEntry?.({
      type: 'gulag',
      message: `${player.name} begins turn ${String(newGulagTurns)} in the Gulag`,
      playerId
    })

    // Check for 10-turn elimination
    get().checkFor10TurnElimination(playerId)

    // Show Gulag escape options if not eliminated
    const updatedPlayer = state.players?.find((p: any) => p.id === playerId)
    if (updatedPlayer != null && !updatedPlayer.isEliminated) {
      set({ pendingAction: { type: 'gulag-escape-choice', data: { playerId } } } as any)
    }
  },

  checkFor10TurnElimination: (playerId) => {
    const state = get() as any
    const player = state.players?.find((p: any) => p.id === playerId)
    if (!player?.inGulag) return

    if (player.gulagTurns >= 10) {
      state.eliminatePlayer?.(playerId, 'gulagTimeout')
    }
  },

  attemptGulagEscape: (playerId, method) => {
    const state = get() as any
    const player = state.players?.find((p: any) => p.id === playerId)
    if (!player?.inGulag) return

    switch (method) {
      case 'roll': {
        // This will be handled by the modal - check if doubles match requirements
        const requiredDoubles = getRequiredDoublesForEscape(player.gulagTurns)
        const dice = state.dice

        if (dice?.[0] === dice?.[1] && requiredDoubles.includes(dice[0])) {
          // Success! Escape the Gulag
          state.updatePlayer?.(playerId, {
            inGulag: false,
            gulagTurns: 0
          })

          const diceValue: number = dice[0]
          state.addLogEntry?.({
            type: 'gulag',
            message: `${player.name} rolled double ${String(diceValue)}s and escaped the Gulag!`,
            playerId
          })

          set({ turnPhase: 'post-turn', pendingAction: null } as any)
        } else {
          // Failed escape
          state.addLogEntry?.({
            type: 'gulag',
            message: `${player.name} failed to escape the Gulag`,
            playerId
          })

          set({ turnPhase: 'post-turn', pendingAction: null } as any)
        }
        break
      }

      case 'pay': {
        // Pay 500₽ and lose one rank
        if (player.rubles >= 500) {
          state.updatePlayer?.(playerId, {
            rubles: player.rubles - 500,
            inGulag: false,
            gulagTurns: 0
          })

          state.adjustTreasury?.(500)
          state.demotePlayer?.(playerId)

          state.addLogEntry?.({
            type: 'gulag',
            message: `${player.name} paid ₽500 for rehabilitation and was released (with demotion)`,
            playerId
          })

          set({ turnPhase: 'post-turn', pendingAction: null } as any)
        }
        break
      }

      case 'vouch': {
        // Set up voucher request
        set({ pendingAction: { type: 'voucher-request', data: { prisonerId: playerId } } } as any)
        break
      }

      case 'inform': {
        // Set up inform modal
        set({ pendingAction: { type: 'inform-on-player', data: { informerId: playerId } } } as any)
        break
      }

      case 'bribe': {
        // Set up bribe modal
        set({ pendingAction: { type: 'bribe-stalin', data: { playerId, reason: 'gulag-escape' } } } as any)
        break
      }

      case 'card': {
        // Use "Get out of Gulag free" card
        if (player.hasFreeFromGulagCard) {
          state.updatePlayer?.(playerId, {
            inGulag: false,
            gulagTurns: 0,
            hasFreeFromGulagCard: false // Remove the card
          })

          state.addLogEntry?.({
            type: 'gulag',
            message: `${player.name} used "Get out of Gulag free" card and was immediately released!`,
            playerId
          })

          set({ turnPhase: 'post-turn', pendingAction: null } as any)
        }
        break
      }
    }
  },

  createVoucher: (prisonerId, voucherId) => {
    const state = get() as any
    const voucher: VoucherAgreement = {
      id: `voucher-${String(Date.now())}`,
      prisonerId,
      voucherId,
      expiresAtRound: (state.roundNumber ?? 0) + 3,
      isActive: true
    }

    const prisoner = state.players?.find((p: any) => p.id === prisonerId)
    const voucherPlayer = state.players?.find((p: any) => p.id === voucherId)

    if (prisoner == null || voucherPlayer == null) return

    // Release prisoner immediately
    state.updatePlayer?.(prisonerId, {
      inGulag: false,
      gulagTurns: 0
    })

    // Update voucher's state
    state.updatePlayer?.(voucherId, {
      vouchingFor: prisonerId,
      vouchedByRound: voucher.expiresAtRound
    })

    set((state) => ({
      activeVouchers: [...state.activeVouchers, voucher],
      pendingAction: null
    } as any))

    state.addLogEntry?.({
      type: 'gulag',
      message: `${voucherPlayer.name} vouched for ${prisoner.name}'s release. WARNING: If ${prisoner.name} commits ANY offence in the next 3 rounds, ${voucherPlayer.name} goes to Gulag too!`
    })

    set({ turnPhase: 'post-turn' } as any)
  },

  checkVoucherConsequences: (playerId, reason) => {
    const state = get() as any

    // Find active voucher where this player is the prisoner
    const activeVoucher = state.activeVouchers?.find(
      (v: VoucherAgreement) => v.prisonerId === playerId && v.isActive && (state.roundNumber ?? 0) <= v.expiresAtRound
    )

    if (activeVoucher != null && shouldTriggerVoucherConsequence(reason)) {
      const voucherPlayer = state.players?.find((p: any) => p.id === activeVoucher.voucherId)
      const player = state.players?.find((p: any) => p.id === playerId)

      if (voucherPlayer != null && player != null) {
        // Voucher must also go to Gulag!
        get().sendToGulag(activeVoucher.voucherId, 'voucherConsequence')

        // Deactivate voucher
        set((state) => ({
          activeVouchers: state.activeVouchers.map((v: VoucherAgreement) =>
            v.id === activeVoucher.id ? { ...v, isActive: false } : v
          )
        } as any))

        state.addLogEntry?.({
          type: 'gulag',
          message: `${voucherPlayer.name} sent to Gulag due to ${player.name}'s offence within voucher period!`
        })
      }
    }
  },

  expireVouchers: () => {
    const state = get() as any
    const expiredVouchers = state.activeVouchers?.filter(
      (v: VoucherAgreement) => v.isActive && (state.roundNumber ?? 0) > v.expiresAtRound
    ) ?? []

    expiredVouchers.forEach((voucher: VoucherAgreement) => {
      const voucherPlayer = state.players?.find((p: any) => p.id === voucher.voucherId)
      if (voucherPlayer != null) {
        state.updatePlayer?.(voucher.voucherId, {
          vouchingFor: null,
          vouchedByRound: null
        })
      }
    })

    if (expiredVouchers.length > 0) {
      set((state) => ({
        activeVouchers: state.activeVouchers.map((v: VoucherAgreement) =>
          expiredVouchers.some((ev: VoucherAgreement) => ev.id === v.id) ? { ...v, isActive: false } : v
        )
      } as any))
    }
  },

  submitBribe: (playerId, amount, reason) => {
    const state = get() as any
    const player = state.players?.find((p: any) => p.id === playerId)
    if (player == null || player.rubles < amount) return

    const bribe: BribeRequest = {
      id: `bribe-${String(Date.now())}`,
      playerId,
      amount,
      reason,
      timestamp: new Date()
    }

    set((state) => ({
      pendingBribes: [...state.pendingBribes, bribe]
    } as any))

    state.addLogEntry?.({
      type: 'system',
      message: `${player.name} has submitted a bribe of ₽${String(amount)} to Stalin`,
      playerId
    })
  },

  respondToBribe: (bribeId, accepted) => {
    const state = get() as any
    const bribe = state.pendingBribes?.find((b: BribeRequest) => b.id === bribeId)
    if (bribe == null) return

    const player = state.players?.find((p: any) => p.id === bribe.playerId)
    if (player == null) return

    // Always take the money
    state.updatePlayer?.(bribe.playerId, { rubles: player.rubles - bribe.amount })
    state.adjustTreasury?.(bribe.amount)

    if (accepted) {
      // Release from Gulag or grant favour
      if (bribe.reason === 'gulag-escape' && player.inGulag) {
        state.updatePlayer?.(bribe.playerId, {
          inGulag: false,
          gulagTurns: 0
        })

        state.addLogEntry?.({
          type: 'gulag',
          message: `Stalin accepted ${player.name}'s bribe of ₽${String(bribe.amount)} and released them from the Gulag`,
          playerId: bribe.playerId
        })

        set({ turnPhase: 'post-turn', pendingAction: null } as any)
      }
    } else {
      // Rejected - money confiscated anyway
      state.addLogEntry?.({
        type: 'payment',
        message: `Stalin rejected ${player.name}'s bribe of ₽${String(bribe.amount)} and confiscated it as contraband`,
        playerId: bribe.playerId
      })
    }

    // Remove bribe from pending
    set((state) => ({
      pendingBribes: state.pendingBribes.filter((b: BribeRequest) => b.id !== bribeId)
    } as any))
  },

  siberianCampsGulag: (custodianId, targetPlayerId) => {
    const state = get() as any
    const custodian = state.players?.find((p: any) => p.id === custodianId)
    const target = state.players?.find((p: any) => p.id === targetPlayerId)

    if ((custodian == null) || (target == null)) return
    if (custodian.hasUsedSiberianCampsGulag) return

    // Check if custodian owns both Siberian Camps (spaces 1 and 3)
    const ownsCampVorkuta = state.properties?.find((p: any) => p.spaceId === 1 && p.custodianId === custodianId)
    const ownsCampKolyma = state.properties?.find((p: any) => p.spaceId === 3 && p.custodianId === custodianId)

    if ((ownsCampVorkuta == null) || (ownsCampKolyma == null)) {
      state.addLogEntry?.({
        type: 'system',
        message: `${custodian.name} must control both Siberian Camps to use this ability!`
      })
      return
    }

    // Ask Stalin for approval (in real game, this would be a modal)
    const approved = window.confirm(
      `STALIN'S APPROVAL REQUIRED\n\n${custodian.name} wants to send ${target.name} to the Gulag for "labour needs".\n\nDo you approve?`
    )

    if (approved) {
      get().sendToGulag(targetPlayerId, 'campLabour')
      state.updatePlayer?.(custodianId, { hasUsedSiberianCampsGulag: true })

      state.addLogEntry?.({
        type: 'gulag',
        message: `${custodian.name} sent ${target.name} to the Gulag for forced labour! (Siberian Camps ability)`,
        playerId: custodianId
      })
    } else {
      state.addLogEntry?.({
        type: 'system',
        message: `Stalin denied ${custodian.name}'s request to send ${target.name} to the Gulag`
      })
    }

    set({ pendingAction: null } as any)
  }
})
