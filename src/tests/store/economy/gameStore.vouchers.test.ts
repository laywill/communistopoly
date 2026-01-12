// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useGameStore, calculateTotalWealth, initializePlayerStats } from '../../../store/gameStore'
import type { Player, Property } from '../../../types/game'

describe('gameStore - Voucher & Bribe System', () => {
  beforeEach(() => {
    // Reset store to clean state
    useGameStore.setState({
      gamePhase: 'playing',
      players: [],
      properties: [],
      gameLog: [],
      stateTreasury: 1000,
      turnPhase: 'pre-roll',
      pendingAction: null,
      activeVouchers: [],
      pendingBribes: [],
      roundNumber: 1
    })
  })

  describe('createVoucher', () => {
    it('should create voucher for prisoner', () => {
      const { initializePlayers, createVoucher } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner', piece: 'sickle', isStalin: false },
        { name: 'Voucher', piece: 'hammer', isStalin: false }
      ])

      const [prisoner, voucherPlayer] = useGameStore.getState().players

      // Put prisoner in Gulag
      useGameStore.getState().updatePlayer(prisoner.id, { inGulag: true, gulagTurns: 2 })

      createVoucher(prisoner.id, voucherPlayer.id)

      const state = useGameStore.getState()
      expect(state.activeVouchers).toHaveLength(1)
      expect(state.activeVouchers[0].prisonerId).toBe(prisoner.id)
      expect(state.activeVouchers[0].voucherId).toBe(voucherPlayer.id)
    })

    it('should release prisoner immediately from Gulag', () => {
      const { initializePlayers, createVoucher } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner', piece: 'sickle', isStalin: false },
        { name: 'Voucher', piece: 'hammer', isStalin: false }
      ])

      const [prisoner, voucherPlayer] = useGameStore.getState().players

      // Put prisoner in Gulag
      useGameStore.getState().updatePlayer(prisoner.id, { inGulag: true, gulagTurns: 2 })

      createVoucher(prisoner.id, voucherPlayer.id)

      const updatedPrisoner = useGameStore.getState().players.find(p => p.id === prisoner.id)
      expect(updatedPrisoner?.inGulag).toBe(false)
      expect(updatedPrisoner?.gulagTurns).toBe(0)
    })

    it('should set voucher expiration to current round + 3', () => {
      const { initializePlayers, createVoucher } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner', piece: 'sickle', isStalin: false },
        { name: 'Voucher', piece: 'hammer', isStalin: false }
      ])

      const [prisoner, voucherPlayer] = useGameStore.getState().players

      useGameStore.getState().updatePlayer(prisoner.id, { inGulag: true, gulagTurns: 2 })
      useGameStore.setState({ roundNumber: 5 })

      createVoucher(prisoner.id, voucherPlayer.id)

      const state = useGameStore.getState()
      expect(state.activeVouchers[0].expiresAtRound).toBe(8) // 5 + 3
    })

    it('should update voucher player vouchingFor property', () => {
      const { initializePlayers, createVoucher } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner', piece: 'sickle', isStalin: false },
        { name: 'Voucher', piece: 'hammer', isStalin: false }
      ])

      const [prisoner, voucherPlayer] = useGameStore.getState().players

      useGameStore.getState().updatePlayer(prisoner.id, { inGulag: true, gulagTurns: 2 })

      createVoucher(prisoner.id, voucherPlayer.id)

      const updatedVoucher = useGameStore.getState().players.find(p => p.id === voucherPlayer.id)
      expect(updatedVoucher?.vouchingFor).toBe(prisoner.id)
      expect(updatedVoucher?.vouchedByRound).toBe(4) // 1 + 3
    })

    it('should set voucher isActive to true', () => {
      const { initializePlayers, createVoucher } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner', piece: 'sickle', isStalin: false },
        { name: 'Voucher', piece: 'hammer', isStalin: false }
      ])

      const [prisoner, voucherPlayer] = useGameStore.getState().players

      useGameStore.getState().updatePlayer(prisoner.id, { inGulag: true, gulagTurns: 2 })

      createVoucher(prisoner.id, voucherPlayer.id)

      const state = useGameStore.getState()
      expect(state.activeVouchers[0].isActive).toBe(true)
    })

    it('should add log entry for voucher creation', () => {
      const { initializePlayers, createVoucher } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner', piece: 'sickle', isStalin: false },
        { name: 'Voucher', piece: 'hammer', isStalin: false }
      ])

      const [prisoner, voucherPlayer] = useGameStore.getState().players

      useGameStore.getState().updatePlayer(prisoner.id, { inGulag: true, gulagTurns: 2 })
      useGameStore.setState({ gameLog: [] })

      createVoucher(prisoner.id, voucherPlayer.id)

      const state = useGameStore.getState()
      const voucherLog = state.gameLog.find(log =>
        log.type === 'gulag' && log.message.includes('vouched for')
      )

      expect(voucherLog).toBeDefined()
      expect(voucherLog?.message).toContain('Voucher')
      expect(voucherLog?.message).toContain('Prisoner')
    })

    it('should set turnPhase to post-turn', () => {
      const { initializePlayers, createVoucher } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner', piece: 'sickle', isStalin: false },
        { name: 'Voucher', piece: 'hammer', isStalin: false }
      ])

      const [prisoner, voucherPlayer] = useGameStore.getState().players

      useGameStore.getState().updatePlayer(prisoner.id, { inGulag: true, gulagTurns: 2 })
      useGameStore.setState({ turnPhase: 'resolving' })

      createVoucher(prisoner.id, voucherPlayer.id)

      const state = useGameStore.getState()
      expect(state.turnPhase).toBe('post-turn')
    })

    it('should set pendingAction to null', () => {
      const { initializePlayers, createVoucher } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner', piece: 'sickle', isStalin: false },
        { name: 'Voucher', piece: 'hammer', isStalin: false }
      ])

      const [prisoner, voucherPlayer] = useGameStore.getState().players

      useGameStore.getState().updatePlayer(prisoner.id, { inGulag: true, gulagTurns: 2 })
      useGameStore.setState({ pendingAction: { type: 'voucher-request', data: {} } })

      createVoucher(prisoner.id, voucherPlayer.id)

      const state = useGameStore.getState()
      expect(state.pendingAction).toBeNull()
    })

    it('should handle non-existent prisoner gracefully', () => {
      const { initializePlayers, createVoucher } = useGameStore.getState()

      initializePlayers([
        { name: 'Voucher', piece: 'hammer', isStalin: false }
      ])

      const [voucherPlayer] = useGameStore.getState().players

      createVoucher('non-existent-id', voucherPlayer.id)

      const state = useGameStore.getState()
      expect(state.activeVouchers).toHaveLength(0) // No voucher created
    })

    it('should handle non-existent voucher player gracefully', () => {
      const { initializePlayers, createVoucher } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner', piece: 'sickle', isStalin: false }
      ])

      const [prisoner] = useGameStore.getState().players

      useGameStore.getState().updatePlayer(prisoner.id, { inGulag: true, gulagTurns: 2 })

      createVoucher(prisoner.id, 'non-existent-id')

      const state = useGameStore.getState()
      expect(state.activeVouchers).toHaveLength(0) // No voucher created
    })
  })

  describe('checkVoucherConsequences', () => {
    it('should send voucher player to Gulag when prisoner commits triggering offense', () => {
      const { initializePlayers, createVoucher, checkVoucherConsequences } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner', piece: 'sickle', isStalin: false },
        { name: 'Voucher', piece: 'hammer', isStalin: false }
      ])

      const [prisoner, voucherPlayer] = useGameStore.getState().players

      // Create voucher
      useGameStore.getState().updatePlayer(prisoner.id, { inGulag: true, gulagTurns: 2 })
      createVoucher(prisoner.id, voucherPlayer.id)

      // Prisoner commits offense
      checkVoucherConsequences(prisoner.id, 'enemyOfState')

      const updatedVoucher = useGameStore.getState().players.find(p => p.id === voucherPlayer.id)
      expect(updatedVoucher?.inGulag).toBe(true)
    })

    it('should deactivate voucher after consequence triggered', () => {
      const { initializePlayers, createVoucher, checkVoucherConsequences } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner', piece: 'sickle', isStalin: false },
        { name: 'Voucher', piece: 'hammer', isStalin: false }
      ])

      const [prisoner, voucherPlayer] = useGameStore.getState().players

      useGameStore.getState().updatePlayer(prisoner.id, { inGulag: true, gulagTurns: 2 })
      createVoucher(prisoner.id, voucherPlayer.id)

      checkVoucherConsequences(prisoner.id, 'threeDoubles')

      const state = useGameStore.getState()
      expect(state.activeVouchers[0].isActive).toBe(false)
    })

    it('should add log entry for voucher consequence', () => {
      const { initializePlayers, createVoucher, checkVoucherConsequences } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner', piece: 'sickle', isStalin: false },
        { name: 'Voucher', piece: 'hammer', isStalin: false }
      ])

      const [prisoner, voucherPlayer] = useGameStore.getState().players

      useGameStore.getState().updatePlayer(prisoner.id, { inGulag: true, gulagTurns: 2 })
      createVoucher(prisoner.id, voucherPlayer.id)

      // Clear log after voucher creation
      useGameStore.setState({ gameLog: [] })

      checkVoucherConsequences(prisoner.id, 'denouncementGuilty')

      const state = useGameStore.getState()
      const consequenceLog = state.gameLog.find(log =>
        log.type === 'gulag' && log.message.includes('sent to Gulag due to')
      )

      expect(consequenceLog).toBeDefined()
      expect(consequenceLog?.message).toContain('Voucher')
      expect(consequenceLog?.message).toContain('Prisoner')
    })

    it('should not trigger consequence for non-triggering reasons', () => {
      const { initializePlayers, createVoucher, checkVoucherConsequences } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner', piece: 'sickle', isStalin: false },
        { name: 'Voucher', piece: 'hammer', isStalin: false }
      ])

      const [prisoner, voucherPlayer] = useGameStore.getState().players

      useGameStore.getState().updatePlayer(prisoner.id, { inGulag: true, gulagTurns: 2 })
      createVoucher(prisoner.id, voucherPlayer.id)

      // Use a non-triggering reason (voucherConsequence itself shouldn't re-trigger)
      checkVoucherConsequences(prisoner.id, 'voucherConsequence')

      const updatedVoucher = useGameStore.getState().players.find(p => p.id === voucherPlayer.id)
      expect(updatedVoucher?.inGulag).toBe(false) // Should not be sent to Gulag

      const state = useGameStore.getState()
      expect(state.activeVouchers[0].isActive).toBe(true) // Voucher still active
    })

    it('should not trigger if voucher has expired', () => {
      const { initializePlayers, createVoucher, checkVoucherConsequences } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner', piece: 'sickle', isStalin: false },
        { name: 'Voucher', piece: 'hammer', isStalin: false }
      ])

      const [prisoner, voucherPlayer] = useGameStore.getState().players

      useGameStore.getState().updatePlayer(prisoner.id, { inGulag: true, gulagTurns: 2 })
      useGameStore.setState({ roundNumber: 1 })
      createVoucher(prisoner.id, voucherPlayer.id)

      // Move to round past expiration (voucher expires at round 4)
      useGameStore.setState({ roundNumber: 5 })

      checkVoucherConsequences(prisoner.id, 'enemyOfState')

      const updatedVoucher = useGameStore.getState().players.find(p => p.id === voucherPlayer.id)
      expect(updatedVoucher?.inGulag).toBe(false) // Should not be sent to Gulag
    })

    it('should not trigger if voucher is already inactive', () => {
      const { initializePlayers, createVoucher, checkVoucherConsequences } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner', piece: 'sickle', isStalin: false },
        { name: 'Voucher', piece: 'hammer', isStalin: false }
      ])

      const [prisoner, voucherPlayer] = useGameStore.getState().players

      useGameStore.getState().updatePlayer(prisoner.id, { inGulag: true, gulagTurns: 2 })
      createVoucher(prisoner.id, voucherPlayer.id)

      // Deactivate the voucher manually
      useGameStore.setState({
        activeVouchers: useGameStore.getState().activeVouchers.map(v => ({ ...v, isActive: false }))
      })

      checkVoucherConsequences(prisoner.id, 'enemyOfState')

      const updatedVoucher = useGameStore.getState().players.find(p => p.id === voucherPlayer.id)
      expect(updatedVoucher?.inGulag).toBe(false) // Should not be sent to Gulag
    })

    it('should handle pilferingCaught as triggering reason', () => {
      const { initializePlayers, createVoucher, checkVoucherConsequences } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner', piece: 'sickle', isStalin: false },
        { name: 'Voucher', piece: 'hammer', isStalin: false }
      ])

      const [prisoner, voucherPlayer] = useGameStore.getState().players

      useGameStore.getState().updatePlayer(prisoner.id, { inGulag: true, gulagTurns: 2 })
      createVoucher(prisoner.id, voucherPlayer.id)

      checkVoucherConsequences(prisoner.id, 'pilferingCaught')

      const updatedVoucher = useGameStore.getState().players.find(p => p.id === voucherPlayer.id)
      expect(updatedVoucher?.inGulag).toBe(true)
    })

    it('should handle stalinDecree as triggering reason', () => {
      const { initializePlayers, createVoucher, checkVoucherConsequences } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner', piece: 'sickle', isStalin: false },
        { name: 'Voucher', piece: 'hammer', isStalin: false }
      ])

      const [prisoner, voucherPlayer] = useGameStore.getState().players

      useGameStore.getState().updatePlayer(prisoner.id, { inGulag: true, gulagTurns: 2 })
      createVoucher(prisoner.id, voucherPlayer.id)

      checkVoucherConsequences(prisoner.id, 'stalinDecree')

      const updatedVoucher = useGameStore.getState().players.find(p => p.id === voucherPlayer.id)
      expect(updatedVoucher?.inGulag).toBe(true)
    })

    it('should handle railwayCapture as triggering reason', () => {
      const { initializePlayers, createVoucher, checkVoucherConsequences } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner', piece: 'sickle', isStalin: false },
        { name: 'Voucher', piece: 'hammer', isStalin: false }
      ])

      const [prisoner, voucherPlayer] = useGameStore.getState().players

      useGameStore.getState().updatePlayer(prisoner.id, { inGulag: true, gulagTurns: 2 })
      createVoucher(prisoner.id, voucherPlayer.id)

      checkVoucherConsequences(prisoner.id, 'railwayCapture')

      const updatedVoucher = useGameStore.getState().players.find(p => p.id === voucherPlayer.id)
      expect(updatedVoucher?.inGulag).toBe(true)
    })

    it('should handle campLabour as triggering reason', () => {
      const { initializePlayers, createVoucher, checkVoucherConsequences } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner', piece: 'sickle', isStalin: false },
        { name: 'Voucher', piece: 'hammer', isStalin: false }
      ])

      const [prisoner, voucherPlayer] = useGameStore.getState().players

      useGameStore.getState().updatePlayer(prisoner.id, { inGulag: true, gulagTurns: 2 })
      createVoucher(prisoner.id, voucherPlayer.id)

      checkVoucherConsequences(prisoner.id, 'campLabour')

      const updatedVoucher = useGameStore.getState().players.find(p => p.id === voucherPlayer.id)
      expect(updatedVoucher?.inGulag).toBe(true)
    })
  })

  describe('expireVouchers', () => {
    it('should expire vouchers after expiration round', () => {
      const { initializePlayers, createVoucher, expireVouchers } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner', piece: 'sickle', isStalin: false },
        { name: 'Voucher', piece: 'hammer', isStalin: false }
      ])

      const [prisoner, voucherPlayer] = useGameStore.getState().players

      useGameStore.getState().updatePlayer(prisoner.id, { inGulag: true, gulagTurns: 2 })
      useGameStore.setState({ roundNumber: 1 })
      createVoucher(prisoner.id, voucherPlayer.id)

      // Voucher expires at round 4, move to round 5
      useGameStore.setState({ roundNumber: 5 })

      expireVouchers()

      const state = useGameStore.getState()
      expect(state.activeVouchers[0].isActive).toBe(false)
    })

    it('should clear vouchingFor from voucher player', () => {
      const { initializePlayers, createVoucher, expireVouchers } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner', piece: 'sickle', isStalin: false },
        { name: 'Voucher', piece: 'hammer', isStalin: false }
      ])

      const [prisoner, voucherPlayer] = useGameStore.getState().players

      useGameStore.getState().updatePlayer(prisoner.id, { inGulag: true, gulagTurns: 2 })
      useGameStore.setState({ roundNumber: 1 })
      createVoucher(prisoner.id, voucherPlayer.id)

      // Verify voucher player is vouchingFor prisoner
      const beforeExpire = useGameStore.getState().players.find(p => p.id === voucherPlayer.id)
      expect(beforeExpire?.vouchingFor).toBe(prisoner.id)

      useGameStore.setState({ roundNumber: 5 })
      expireVouchers()

      const updatedVoucher = useGameStore.getState().players.find(p => p.id === voucherPlayer.id)
      expect(updatedVoucher?.vouchingFor).toBeNull()
      expect(updatedVoucher?.vouchedByRound).toBeNull()
    })

    it('should not expire vouchers still within expiration period', () => {
      const { initializePlayers, createVoucher, expireVouchers } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner', piece: 'sickle', isStalin: false },
        { name: 'Voucher', piece: 'hammer', isStalin: false }
      ])

      const [prisoner, voucherPlayer] = useGameStore.getState().players

      useGameStore.getState().updatePlayer(prisoner.id, { inGulag: true, gulagTurns: 2 })
      useGameStore.setState({ roundNumber: 1 })
      createVoucher(prisoner.id, voucherPlayer.id)

      // Voucher expires at round 4, currently at round 3
      useGameStore.setState({ roundNumber: 3 })

      expireVouchers()

      const state = useGameStore.getState()
      expect(state.activeVouchers[0].isActive).toBe(true) // Still active
    })

    it('should expire vouchers exactly at expiration round', () => {
      const { initializePlayers, createVoucher, expireVouchers } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner', piece: 'sickle', isStalin: false },
        { name: 'Voucher', piece: 'hammer', isStalin: false }
      ])

      const [prisoner, voucherPlayer] = useGameStore.getState().players

      useGameStore.getState().updatePlayer(prisoner.id, { inGulag: true, gulagTurns: 2 })
      useGameStore.setState({ roundNumber: 1 })
      createVoucher(prisoner.id, voucherPlayer.id)

      // Voucher expires at round 4
      useGameStore.setState({ roundNumber: 4 })

      expireVouchers()

      const state = useGameStore.getState()
      // At exactly expiration round, should NOT expire (roundNumber > expiresAtRound)
      expect(state.activeVouchers[0].isActive).toBe(true)
    })

    it('should handle multiple vouchers with different expiration dates', () => {
      const { initializePlayers, createVoucher, expireVouchers } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner1', piece: 'sickle', isStalin: false },
        { name: 'Voucher1', piece: 'hammer', isStalin: false },
        { name: 'Prisoner2', piece: 'tank', isStalin: false },
        { name: 'Voucher2', piece: 'redStar', isStalin: false }
      ])

      const [prisoner1, voucher1, prisoner2, voucher2] = useGameStore.getState().players

      useGameStore.getState().updatePlayer(prisoner1.id, { inGulag: true, gulagTurns: 2 })
      useGameStore.getState().updatePlayer(prisoner2.id, { inGulag: true, gulagTurns: 2 })

      // Create first voucher at round 1 (expires at round 4)
      useGameStore.setState({ roundNumber: 1 })
      createVoucher(prisoner1.id, voucher1.id)

      // Create second voucher at round 3 (expires at round 6)
      useGameStore.setState({ roundNumber: 3 })
      createVoucher(prisoner2.id, voucher2.id)

      // Move to round 5 (first expires, second doesn't)
      useGameStore.setState({ roundNumber: 5 })
      expireVouchers()

      const state = useGameStore.getState()
      expect(state.activeVouchers[0].isActive).toBe(false) // First expired
      expect(state.activeVouchers[1].isActive).toBe(true)  // Second still active
    })

    it('should not expire already inactive vouchers', () => {
      const { initializePlayers, createVoucher, expireVouchers } = useGameStore.getState()

      initializePlayers([
        { name: 'Prisoner', piece: 'sickle', isStalin: false },
        { name: 'Voucher', piece: 'hammer', isStalin: false }
      ])

      const [prisoner, voucherPlayer] = useGameStore.getState().players

      useGameStore.getState().updatePlayer(prisoner.id, { inGulag: true, gulagTurns: 2 })
      useGameStore.setState({ roundNumber: 1 })
      createVoucher(prisoner.id, voucherPlayer.id)

      // Deactivate voucher manually (e.g., from consequence)
      useGameStore.setState({
        activeVouchers: useGameStore.getState().activeVouchers.map(v => ({ ...v, isActive: false }))
      })

      useGameStore.setState({ roundNumber: 5 })
      expireVouchers()

      // Should remain inactive (no change)
      const state = useGameStore.getState()
      expect(state.activeVouchers[0].isActive).toBe(false)
    })
  })

  describe('submitBribe', () => {
    it('should add bribe to pendingBribes', () => {
      const { initializePlayers, submitBribe } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      submitBribe(player1.id, 500, 'gulag-escape')

      const state = useGameStore.getState()
      expect(state.pendingBribes).toHaveLength(1)
      expect(state.pendingBribes[0].playerId).toBe(player1.id)
      expect(state.pendingBribes[0].amount).toBe(500)
      expect(state.pendingBribes[0].reason).toBe('gulag-escape')
    })

    it('should create bribe with correct properties', () => {
      const { initializePlayers, submitBribe } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      submitBribe(player1.id, 300, 'favour')

      const state = useGameStore.getState()
      const bribe = state.pendingBribes[0]

      expect(bribe.id).toMatch(/^bribe-/)
      expect(bribe.playerId).toBe(player1.id)
      expect(bribe.amount).toBe(300)
      expect(bribe.reason).toBe('favour')
      expect(bribe.timestamp).toBeInstanceOf(Date)
    })

    it('should add log entry for bribe submission', () => {
      const { initializePlayers, submitBribe } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      useGameStore.setState({ gameLog: [] })

      submitBribe(player1.id, 400, 'gulag-escape')

      const state = useGameStore.getState()
      const bribeLog = state.gameLog.find(log =>
        log.type === 'system' && log.message.includes('submitted a bribe')
      )

      expect(bribeLog).toBeDefined()
      expect(bribeLog?.message).toContain('₽400')
      expect(bribeLog?.playerId).toBe(player1.id)
    })

    it('should not submit bribe if player has insufficient rubles', () => {
      const { initializePlayers, updatePlayer, submitBribe } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      updatePlayer(player1.id, { rubles: 100 })

      submitBribe(player1.id, 500, 'gulag-escape') // Player only has 100

      const state = useGameStore.getState()
      expect(state.pendingBribes).toHaveLength(0) // No bribe created
    })

    it('should handle non-existent player gracefully', () => {
      const { initializePlayers, submitBribe } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      submitBribe('non-existent-id', 500, 'gulag-escape')

      const state = useGameStore.getState()
      expect(state.pendingBribes).toHaveLength(0) // No bribe created
    })

    it('should allow multiple bribes from same player', () => {
      const { initializePlayers, submitBribe } = useGameStore.getState()

      initializePlayers([
        { name: 'Rich Player', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players
      useGameStore.getState().updatePlayer(player1.id, { rubles: 3000 })

      submitBribe(player1.id, 500, 'gulag-escape')
      submitBribe(player1.id, 300, 'favour')

      const state = useGameStore.getState()
      expect(state.pendingBribes).toHaveLength(2)
    })
  })

  describe('respondToBribe', () => {
    it('should deduct bribe amount from player when accepted', () => {
      const { initializePlayers, submitBribe, respondToBribe } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players
      const initialRubles = player1.rubles

      submitBribe(player1.id, 500, 'gulag-escape')
      const bribeId = useGameStore.getState().pendingBribes[0].id

      respondToBribe(bribeId, true)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.rubles).toBe(initialRubles - 500)
    })

    it('should deduct bribe amount from player when rejected', () => {
      const { initializePlayers, submitBribe, respondToBribe } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players
      const initialRubles = player1.rubles

      submitBribe(player1.id, 500, 'gulag-escape')
      const bribeId = useGameStore.getState().pendingBribes[0].id

      respondToBribe(bribeId, false)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.rubles).toBe(initialRubles - 500) // Money taken anyway
    })

    it('should add bribe amount to treasury', () => {
      const { initializePlayers, submitBribe, respondToBribe } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players
      const initialTreasury = useGameStore.getState().stateTreasury

      submitBribe(player1.id, 500, 'gulag-escape')
      const bribeId = useGameStore.getState().pendingBribes[0].id

      respondToBribe(bribeId, true)

      const state = useGameStore.getState()
      expect(state.stateTreasury).toBe(initialTreasury + 500)
    })

    it('should release player from Gulag when gulag-escape bribe accepted', () => {
      const { initializePlayers, updatePlayer, submitBribe, respondToBribe } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      updatePlayer(player1.id, { inGulag: true, gulagTurns: 2 })

      submitBribe(player1.id, 500, 'gulag-escape')
      const bribeId = useGameStore.getState().pendingBribes[0].id

      respondToBribe(bribeId, true)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.inGulag).toBe(false)
      expect(updatedPlayer?.gulagTurns).toBe(0)
    })

    it('should not release player from Gulag when bribe rejected', () => {
      const { initializePlayers, updatePlayer, submitBribe, respondToBribe } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      updatePlayer(player1.id, { inGulag: true, gulagTurns: 2 })

      submitBribe(player1.id, 500, 'gulag-escape')
      const bribeId = useGameStore.getState().pendingBribes[0].id

      respondToBribe(bribeId, false)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.inGulag).toBe(true) // Still in Gulag
      expect(updatedPlayer?.gulagTurns).toBe(2)
    })

    it('should add log entry when bribe accepted', () => {
      const { initializePlayers, updatePlayer, submitBribe, respondToBribe } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      updatePlayer(player1.id, { inGulag: true, gulagTurns: 2 })
      submitBribe(player1.id, 500, 'gulag-escape')

      useGameStore.setState({ gameLog: [] })

      const bribeId = useGameStore.getState().pendingBribes[0].id

      respondToBribe(bribeId, true)

      const state = useGameStore.getState()
      const acceptLog = state.gameLog.find(log =>
        log.type === 'gulag' && log.message.includes('accepted') && log.message.includes('bribe')
      )

      expect(acceptLog).toBeDefined()
      expect(acceptLog?.message).toContain('₽500')
      expect(acceptLog?.playerId).toBe(player1.id)
    })

    it('should add log entry when bribe rejected', () => {
      const { initializePlayers, submitBribe, respondToBribe } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      submitBribe(player1.id, 500, 'gulag-escape')

      useGameStore.setState({ gameLog: [] })

      const bribeId = useGameStore.getState().pendingBribes[0].id

      respondToBribe(bribeId, false)

      const state = useGameStore.getState()
      const rejectLog = state.gameLog.find(log =>
        log.type === 'payment' && log.message.includes('rejected') && log.message.includes('bribe')
      )

      expect(rejectLog).toBeDefined()
      expect(rejectLog?.message).toContain('₽500')
      expect(rejectLog?.message).toContain('contraband')
      expect(rejectLog?.playerId).toBe(player1.id)
    })

    it('should remove bribe from pendingBribes after response', () => {
      const { initializePlayers, submitBribe, respondToBribe } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      submitBribe(player1.id, 500, 'gulag-escape')
      const bribeId = useGameStore.getState().pendingBribes[0].id

      expect(useGameStore.getState().pendingBribes).toHaveLength(1)

      respondToBribe(bribeId, true)

      const state = useGameStore.getState()
      expect(state.pendingBribes).toHaveLength(0)
    })

    it('should set turnPhase to post-turn when accepted', () => {
      const { initializePlayers, updatePlayer, submitBribe, respondToBribe } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      updatePlayer(player1.id, { inGulag: true, gulagTurns: 2 })
      submitBribe(player1.id, 500, 'gulag-escape')

      useGameStore.setState({ turnPhase: 'resolving' })

      const bribeId = useGameStore.getState().pendingBribes[0].id

      respondToBribe(bribeId, true)

      const state = useGameStore.getState()
      expect(state.turnPhase).toBe('post-turn')
    })

    it('should set pendingAction to null when accepted', () => {
      const { initializePlayers, updatePlayer, submitBribe, respondToBribe } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      updatePlayer(player1.id, { inGulag: true, gulagTurns: 2 })
      submitBribe(player1.id, 500, 'gulag-escape')

      useGameStore.setState({ pendingAction: { type: 'bribe-stalin', data: {} } })

      const bribeId = useGameStore.getState().pendingBribes[0].id

      respondToBribe(bribeId, true)

      const state = useGameStore.getState()
      expect(state.pendingAction).toBeNull()
    })

    it('should handle non-existent bribe gracefully', () => {
      const { initializePlayers, respondToBribe } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players
      const initialRubles = player1.rubles
      const initialTreasury = useGameStore.getState().stateTreasury

      respondToBribe('non-existent-id', true)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.rubles).toBe(initialRubles) // No change
      expect(useGameStore.getState().stateTreasury).toBe(initialTreasury) // No change
    })

    it('should handle non-existent player gracefully', () => {
      const { initializePlayers, submitBribe, respondToBribe } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      submitBribe(player1.id, 500, 'gulag-escape')
      const bribeId = useGameStore.getState().pendingBribes[0].id

      // Manually set bribe to non-existent player
      useGameStore.setState({
        pendingBribes: [{ ...useGameStore.getState().pendingBribes[0], playerId: 'non-existent-id' }]
      })

      const initialTreasury = useGameStore.getState().stateTreasury

      respondToBribe(bribeId, true)

      // Should not add to treasury or crash
      expect(useGameStore.getState().stateTreasury).toBe(initialTreasury)
    })

    it('should not release player if not in Gulag', () => {
      const { initializePlayers, submitBribe, respondToBribe } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players

      // Player not in Gulag
      submitBribe(player1.id, 500, 'gulag-escape')
      const bribeId = useGameStore.getState().pendingBribes[0].id

      respondToBribe(bribeId, true)

      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.inGulag).toBe(false) // Still false (was already false)
    })

    it('should handle non-gulag-escape reasons when accepted', () => {
      const { initializePlayers, submitBribe, respondToBribe } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'sickle', isStalin: false }
      ])

      const [player1] = useGameStore.getState().players
      const initialRubles = player1.rubles

      submitBribe(player1.id, 500, 'favour')
      const bribeId = useGameStore.getState().pendingBribes[0].id

      respondToBribe(bribeId, true)

      // Money should be taken, but no Gulag release
      const updatedPlayer = useGameStore.getState().players.find(p => p.id === player1.id)
      expect(updatedPlayer?.rubles).toBe(initialRubles - 500)
      expect(updatedPlayer?.inGulag).toBe(false)
    })
  })
})
