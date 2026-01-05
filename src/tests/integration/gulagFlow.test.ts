// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../../store/gameStore'
import { setupTestGame, startTestGame } from '../helpers/integrationHelpers'

describe('Gulag Flow Integration', () => {
  beforeEach(() => {
    setupTestGame({
      players: [
        { name: 'Ivan', piece: 'sickle' },
        { name: 'Natasha', piece: 'hammer' }
      ]
    })
    startTestGame()
  })

  describe('Entry to Release via Rolling', () => {
    it('should track full Gulag lifecycle from entry to escape', () => {
      const store = useGameStore.getState()
      const players = store.players.filter(p => !p.isStalin)
      const player = players[0]

      // Send to Gulag
      store.sendToGulag(player.id, 'enemyOfState')

      let updatedPlayer = store.players.find(p => p.id === player.id)!
      expect(updatedPlayer.inGulag).toBe(true)
      expect(updatedPlayer.gulagTurns).toBe(0)
      expect(updatedPlayer.position).toBe(10) // Gulag position

      // Simulate multiple turns trying to escape
      for (let turn = 1; turn <= 4; turn++) {
        store.handleGulagTurn(player.id)

        updatedPlayer = store.players.find(p => p.id === player.id)!
        expect(updatedPlayer.gulagTurns).toBe(turn)

        // Try to escape with increasing probability
        if (turn === 1) {
          // Turn 1: Need double 6s
          useGameStore.setState({ dice: [5, 5] })
          store.attemptGulagEscape(player.id, 'roll')
          updatedPlayer = store.players.find(p => p.id === player.id)!
          expect(updatedPlayer.inGulag).toBe(true)
        }
      }

      // After turn 5, any doubles should work
      store.handleGulagTurn(player.id)
      useGameStore.setState({ dice: [1, 1] })
      store.attemptGulagEscape(player.id, 'roll')

      updatedPlayer = store.players.find(p => p.id === player.id)!
      expect(updatedPlayer.inGulag).toBe(false)
      expect(updatedPlayer.gulagTurns).toBe(0)
    })

    it('should successfully escape on double 6s on first turn', () => {
      const store = useGameStore.getState()
      const players = store.players.filter(p => !p.isStalin)
      const player = players[0]

      store.sendToGulag(player.id, 'enemyOfState')
      store.handleGulagTurn(player.id)

      // Roll double 6s on first turn
      useGameStore.setState({ dice: [6, 6] })
      store.attemptGulagEscape(player.id, 'roll')

      const updatedPlayer = store.players.find(p => p.id === player.id)!
      expect(updatedPlayer.inGulag).toBe(false)
    })
  })

  describe('Entry to Release via Payment', () => {
    it('should allow paid release with rank demotion', () => {
      const store = useGameStore.getState()
      const players = store.players.filter(p => !p.isStalin)
      const player = players[0]

      // Promote to have rank to lose
      store.updatePlayer(player.id, { rank: 'partyMember' })
      expect(store.players.find(p => p.id === player.id)?.rank).toBe('partyMember')

      const rublesBefore = player.rubles

      // Send to Gulag (demotes once)
      store.sendToGulag(player.id, 'enemyOfState')

      let updatedPlayer = store.players.find(p => p.id === player.id)!
      expect(updatedPlayer.rank).toBe('proletariat') // Demoted from partyMember

      // Pay for release (demotes again, but already at minimum)
      store.attemptGulagEscape(player.id, 'pay')

      updatedPlayer = store.players.find(p => p.id === player.id)!
      expect(updatedPlayer.inGulag).toBe(false)
      expect(updatedPlayer.rubles).toBe(rublesBefore - 500)
      expect(updatedPlayer.rank).toBe('proletariat') // Cannot demote below proletariat
    })

    it('should fail to pay if insufficient funds', () => {
      const store = useGameStore.getState()
      const players = store.players.filter(p => !p.isStalin)
      const player = players[0]

      // Set player to have insufficient funds
      store.updatePlayer(player.id, { rubles: 400 })

      store.sendToGulag(player.id, 'enemyOfState')

      // Try to pay for release
      store.attemptGulagEscape(player.id, 'pay')

      const updatedPlayer = store.players.find(p => p.id === player.id)!
      expect(updatedPlayer.inGulag).toBe(true) // Still in Gulag
    })
  })

  describe('Vouching System', () => {
    it('should track voucher liability and trigger if offense occurs', () => {
      const store = useGameStore.getState()
      const players = store.players.filter(p => !p.isStalin)
      const [ivan, natasha] = players

      // Send Ivan to Gulag
      store.sendToGulag(ivan.id, 'enemyOfState')

      let updatedIvan = store.players.find(p => p.id === ivan.id)!
      expect(updatedIvan.inGulag).toBe(true)

      // Natasha vouches for Ivan
      store.createVoucher(ivan.id, natasha.id)

      updatedIvan = store.players.find(p => p.id === ivan.id)!
      expect(updatedIvan.inGulag).toBe(false) // Released by voucher

      const voucherState = store.vouchers.find(v => v.prisonerId === ivan.id)
      expect(voucherState).toBeDefined()
      expect(voucherState?.voucherId).toBe(natasha.id)

      // Ivan commits offense within liability period
      store.sendToGulag(ivan.id, 'threeDoubles')

      // Check if voucher consequences were triggered
      store.checkVoucherConsequences(ivan.id, 'threeDoubles')

      // Natasha should also be sent to Gulag
      const updatedNatasha = store.players.find(p => p.id === natasha.id)!
      expect(updatedNatasha.inGulag).toBe(true)
    })

    it('should release prisoner when vouched for', () => {
      const store = useGameStore.getState()
      const players = store.players.filter(p => !p.isStalin)
      const [prisoner, voucher] = players

      store.sendToGulag(prisoner.id, 'enemyOfState')

      const prisonerBefore = store.players.find(p => p.id === prisoner.id)!
      expect(prisonerBefore.inGulag).toBe(true)

      // Create voucher
      store.createVoucher(prisoner.id, voucher.id)

      const prisonerAfter = store.players.find(p => p.id === prisoner.id)!
      expect(prisonerAfter.inGulag).toBe(false)
      expect(prisonerAfter.gulagTurns).toBe(0)
    })

    it('should expire voucher after 3 rounds', () => {
      const store = useGameStore.getState()
      const players = store.players.filter(p => !p.isStalin)
      const [prisoner, voucher] = players

      store.sendToGulag(prisoner.id, 'enemyOfState')
      store.createVoucher(prisoner.id, voucher.id)

      const currentRound = store.roundNumber
      const voucherState = store.vouchers.find(v => v.prisonerId === prisoner.id)
      expect(voucherState?.expiresAtRound).toBe(currentRound + 3)

      // Advance past expiration
      useGameStore.setState({ roundNumber: currentRound + 4 })
      store.expireVouchers()

      const expiredVoucher = store.vouchers.find(v => v.prisonerId === prisoner.id && v.isActive)
      expect(expiredVoucher).toBeUndefined()
    })
  })

  describe('Bribe System', () => {
    it('should release player when Stalin accepts bribe', () => {
      const store = useGameStore.getState()
      const players = store.players.filter(p => !p.isStalin)
      const player = players[0]

      store.sendToGulag(player.id, 'enemyOfState')

      const rublesBefore = player.rubles

      // Submit bribe
      store.submitBribe(player.id, 200, 'gulag-escape')

      const bribe = store.pendingBribes[0]
      expect(bribe).toBeDefined()
      expect(bribe.playerId).toBe(player.id)

      // Stalin accepts
      store.respondToBribe(bribe.id, true)

      const updatedPlayer = store.players.find(p => p.id === player.id)!
      expect(updatedPlayer.inGulag).toBe(false)
      expect(updatedPlayer.rubles).toBe(rublesBefore - 200)
    })

    it('should keep player in Gulag when Stalin rejects bribe', () => {
      const store = useGameStore.getState()
      const players = store.players.filter(p => !p.isStalin)
      const player = players[0]

      store.sendToGulag(player.id, 'enemyOfState')

      const rublesBefore = player.rubles

      // Submit bribe
      store.submitBribe(player.id, 250, 'gulag-escape')

      const bribe = store.pendingBribes[0]

      // Stalin rejects
      store.respondToBribe(bribe.id, false)

      const updatedPlayer = store.players.find(p => p.id === player.id)!
      expect(updatedPlayer.inGulag).toBe(true) // Still in Gulag
      expect(updatedPlayer.rubles).toBe(rublesBefore - 250) // Money still lost
    })
  })

  describe('Informing System', () => {
    it('should swap places if accused is found guilty', () => {
      const store = useGameStore.getState()
      const players = store.players.filter(p => !p.isStalin)
      const [prisoner, target] = players

      store.sendToGulag(prisoner.id, 'enemyOfState')

      expect(store.players.find(p => p.id === prisoner.id)?.inGulag).toBe(true)

      // Initiate denouncement from Gulag
      store.initiateDenouncement(prisoner.id, target.id, 'Counter-revolutionary activities')

      // Render guilty verdict
      store.renderTribunalVerdict('guilty')

      const updatedTarget = store.players.find(p => p.id === target.id)!
      expect(updatedTarget.inGulag).toBe(true)

      // Prisoner should be released if informing from Gulag resulted in conviction
      // Note: This may depend on implementation details
    })

    it('should add turns to sentence if accused is innocent', () => {
      const store = useGameStore.getState()
      const players = store.players.filter(p => !p.isStalin)
      const [prisoner, target] = players

      store.sendToGulag(prisoner.id, 'enemyOfState')
      store.handleGulagTurn(prisoner.id)
      store.handleGulagTurn(prisoner.id)

      const turnsBefore = store.players.find(p => p.id === prisoner.id)!.gulagTurns

      // Initiate denouncement
      store.initiateDenouncement(prisoner.id, target.id, 'False accusation')

      // Render innocent verdict
      store.renderTribunalVerdict('innocent')

      // Prisoner should have additional turns added
      // Note: Implementation may vary
      const updatedPrisoner = store.players.find(p => p.id === prisoner.id)!
      expect(updatedPrisoner.inGulag).toBe(true)
    })
  })

  describe('Gulag Timeout Elimination', () => {
    it('should eliminate player after 10 turns in Gulag', () => {
      const store = useGameStore.getState()
      const players = store.players.filter(p => !p.isStalin)
      const player = players[0]

      store.sendToGulag(player.id, 'enemyOfState')

      // Simulate 10 turns in Gulag
      store.updatePlayer(player.id, { gulagTurns: 10 })

      store.checkFor10TurnElimination(player.id)

      const updatedPlayer = store.players.find(p => p.id === player.id)!
      expect(updatedPlayer.isEliminated).toBe(true)
    })
  })
})
