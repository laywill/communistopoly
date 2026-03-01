// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { StateCreator } from 'zustand'
import type { GameStore } from '../types/storeTypes'
import type { VoucherAgreement, GulagReason } from '../../types/game'
import { shouldTriggerVoucherConsequence } from '../helpers/gulagHelpers'
import { VOUCHER_EXPIRY_ROUNDS } from '../constants'

// Slice state interface
export interface VoucherSliceState {
  activeVouchers: VoucherAgreement[]
}

// Slice actions interface
export interface VoucherSliceActions {
  createVoucher: (prisonerId: string, voucherId: string) => void
  checkVoucherConsequences: (playerId: string, reason: GulagReason) => void
  expireVouchers: () => void
}

// Combined slice type
export type VoucherSlice = VoucherSliceState & VoucherSliceActions

// Initial state for this slice
export const initialVoucherState: VoucherSliceState = {
  activeVouchers: []
}

// Slice creator with full typing
export const createVoucherSlice: StateCreator<
  GameStore,
  [],
  [],
  VoucherSlice
> = (set, get) => ({
  ...initialVoucherState,

  createVoucher: (prisonerId, voucherId) => {
    const state = get()
    const voucher: VoucherAgreement = {
      id: `voucher-${String(Date.now())}-${prisonerId}`,
      prisonerId,
      voucherId,
      expiresAtRound: (state.roundNumber) + VOUCHER_EXPIRY_ROUNDS,
      isActive: true
    }

    const prisoner = state.players.find((p) => p.id === prisonerId)
    const voucherPlayer = state.players.find((p) => p.id === voucherId)

    if (prisoner == null || voucherPlayer == null) return

    // Release prisoner immediately
    get().updatePlayer(prisonerId, {
      inGulag: false,
      gulagTurns: 0
    })

    // Check if RedStar player at Proletariat should be executed
    get().checkRedStarExecutionAfterGulagRelease(prisonerId)

    // Update voucher's state
    get().updatePlayer(voucherId, {
      vouchingFor: prisonerId,
      vouchedByRound: voucher.expiresAtRound
    })

    set((state) => ({
      activeVouchers: [...state.activeVouchers, voucher],
      pendingAction: null
    }))

    get().addLogEntry({
      type: 'gulag',
      message: `${voucherPlayer.name} vouched for ${prisoner.name}'s release. WARNING: If ${prisoner.name} commits ANY offence in the next ${String(VOUCHER_EXPIRY_ROUNDS)} rounds, ${voucherPlayer.name} goes to Gulag too!`
    })

    set({ turnPhase: 'post-turn' })
  },

  checkVoucherConsequences: (playerId, reason) => {
    const state = get()

    // Find active voucher where this player is the prisoner
    const activeVoucher = state.activeVouchers.find(
      (v) => v.prisonerId === playerId && v.isActive && state.roundNumber <= v.expiresAtRound
    )

    if (activeVoucher != null && shouldTriggerVoucherConsequence(reason)) {
      const voucherPlayer = state.players.find((p) => p.id === activeVoucher.voucherId)
      const player = state.players.find((p) => p.id === playerId)

      if (voucherPlayer != null && player != null) {
        // Voucher must also go to Gulag!
        get().sendToGulag(activeVoucher.voucherId, 'voucherConsequence')

        // Deactivate voucher
        set((state) => ({
          activeVouchers: state.activeVouchers.map((v) =>
            v.id === activeVoucher.id ? { ...v, isActive: false } : v
          )
        }))

        get().addLogEntry({
          type: 'gulag',
          message: `${voucherPlayer.name} sent to Gulag due to ${player.name}'s offence within voucher period!`
        })
      }
    }
  },

  expireVouchers: () => {
    const state = get()
    const expiredVouchers = state.activeVouchers.filter(
      (v) => v.isActive && state.roundNumber > v.expiresAtRound
    )

    expiredVouchers.forEach((voucher) => {
      const voucherPlayer = state.players.find((p) => p.id === voucher.voucherId)
      if (voucherPlayer != null) {
        get().updatePlayer(voucher.voucherId, {
          vouchingFor: null,
          vouchedByRound: null
        })
      }
    })

    if (expiredVouchers.length > 0) {
      set((state) => ({
        activeVouchers: state.activeVouchers.map((v) =>
          expiredVouchers.some((ev) => ev.id === v.id) ? { ...v, isActive: false } : v
        )
      }))
    }
  }
})
