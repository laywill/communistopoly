// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../../../store/gameStore'

/**
 * Tests that entity IDs use crypto.randomUUID() instead of Date.now()
 * to prevent collision risk when actions fire in the same millisecond.
 *
 * Affected slices: confessionSlice, debtAndEliminationSlice, tradeSlice,
 * tribunalSlice, voucherSlice, uiSlice
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

describe('Entity ID Generation — crypto.randomUUID()', () => {
  beforeEach(() => {
    const store = useGameStore.getState()
    store.resetGame()
  })

  it('should generate UUID-based confession IDs', () => {
    const store = useGameStore.getState()

    store.initializePlayers([
      { name: 'Stalin', piece: null, isStalin: true },
      { name: 'Prisoner', piece: 'hammer', isStalin: false }
    ])

    const prisoner = useGameStore.getState().players.find(p => !p.isStalin)
    expect(prisoner).toBeDefined()

    // Put player in gulag so confession is accepted
    store.updatePlayer(prisoner?.id ?? '', { inGulag: true, gulagTurns: 1 })

    store.submitConfession(prisoner?.id ?? '', 'I confess to counter-revolutionary activities against the Party')

    const confessions = useGameStore.getState().confessions
    expect(confessions).toHaveLength(1)
    expect(confessions[0].id).toMatch(/^confession-/)
    const uuidPart = confessions[0].id.replace('confession-', '')
    expect(uuidPart).toMatch(UUID_REGEX)
  })

  it('should generate UUID-based trade IDs', () => {
    const store = useGameStore.getState()

    store.initializePlayers([
      { name: 'Trader 1', piece: 'hammer', isStalin: false },
      { name: 'Trader 2', piece: 'sickle', isStalin: false }
    ])

    const [player1, player2] = useGameStore.getState().players

    store.proposeTrade(player1.id, player2.id, {
      offering: { rubles: 100, properties: [], gulagCards: 0, favours: 0 },
      requesting: { rubles: 0, properties: [], gulagCards: 0, favours: 0 }
    })

    const trades = useGameStore.getState().activeTradeOffers
    expect(trades).toHaveLength(1)
    expect(trades[0].id).toMatch(/^trade-/)
    const uuidPart = trades[0].id.replace('trade-', '')
    expect(uuidPart).toMatch(UUID_REGEX)
  })

  it('should generate UUID-based denouncement IDs', () => {
    const store = useGameStore.getState()

    store.initializePlayers([
      { name: 'Accuser', piece: 'hammer', isStalin: false },
      { name: 'Accused', piece: 'sickle', isStalin: false }
    ])

    const [accuser, accused] = useGameStore.getState().players

    store.initiateDenouncement(accuser.id, accused.id, 'Counter-revolutionary thought')

    const denouncements = useGameStore.getState().denouncementsThisRound
    expect(denouncements).toHaveLength(1)
    expect(denouncements[0].id).toMatch(/^denouncement-/)
    const uuidPart = denouncements[0].id.replace('denouncement-', '')
    expect(uuidPart).toMatch(UUID_REGEX)
  })

  it('should generate UUID-based tribunal IDs', () => {
    const store = useGameStore.getState()

    store.initializePlayers([
      { name: 'Accuser', piece: 'hammer', isStalin: false },
      { name: 'Accused', piece: 'sickle', isStalin: false }
    ])

    const [accuser, accused] = useGameStore.getState().players

    store.initiateDenouncement(accuser.id, accused.id, 'Hoarding grain')

    const tribunal = useGameStore.getState().activeTribunal
    expect(tribunal).not.toBeNull()
    expect(tribunal?.id).toMatch(/^tribunal-/)
    const uuidPart = tribunal?.id.replace('tribunal-', '') ?? ''
    expect(uuidPart).toMatch(UUID_REGEX)
  })

  it('should generate UUID-based bribe IDs', () => {
    const store = useGameStore.getState()

    store.initializePlayers([
      { name: 'Stalin', piece: null, isStalin: true },
      { name: 'Briber', piece: 'hammer', isStalin: false }
    ])

    const briber = useGameStore.getState().players.find(p => !p.isStalin)
    expect(briber).toBeDefined()

    // Give player enough rubles
    store.updatePlayer(briber?.id ?? '', { rubles: 500 })

    store.submitBribe(briber?.id ?? '', 100, 'gulag-escape')

    const bribes = useGameStore.getState().pendingBribes
    expect(bribes).toHaveLength(1)
    expect(bribes[0].id).toMatch(/^bribe-/)
    const uuidPart = bribes[0].id.replace('bribe-', '')
    expect(uuidPart).toMatch(UUID_REGEX)
  })

  it('should generate UUID-based debt IDs', () => {
    const store = useGameStore.getState()

    store.initializePlayers([
      { name: 'Debtor', piece: 'hammer', isStalin: false },
      { name: 'Creditor', piece: 'sickle', isStalin: false }
    ])

    const [debtor, creditor] = useGameStore.getState().players

    store.createDebt(debtor.id, creditor.id, 200, 'Unpaid quota')

    const updatedDebtor = useGameStore.getState().players.find(p => p.id === debtor.id)
    expect(updatedDebtor).toBeDefined()
    expect(updatedDebtor?.debt).not.toBeNull()
    expect(updatedDebtor?.debt?.id).toMatch(/^debt-/)
    const uuidPart = updatedDebtor?.debt?.id.replace('debt-', '') ?? ''
    expect(uuidPart).toMatch(UUID_REGEX)
  })

  it('should generate UUID-based voucher IDs', () => {
    const store = useGameStore.getState()

    store.initializePlayers([
      { name: 'Stalin', piece: null, isStalin: true },
      { name: 'Prisoner', piece: 'hammer', isStalin: false },
      { name: 'Voucher', piece: 'sickle', isStalin: false }
    ])

    const players = useGameStore.getState().players
    const prisoner = players.find(p => p.piece === 'hammer')
    const voucher = players.find(p => p.piece === 'sickle')
    expect(prisoner).toBeDefined()
    expect(voucher).toBeDefined()

    // Put prisoner in gulag
    store.sendToGulag(prisoner?.id ?? '', 'campLabour')

    // Create voucher
    store.createVoucher(prisoner?.id ?? '', voucher?.id ?? '')

    const vouchers = useGameStore.getState().activeVouchers
    expect(vouchers).toHaveLength(1)
    expect(vouchers[0].id).toMatch(/^voucher-/)
    const uuidPart = vouchers[0].id.replace('voucher-', '')
    expect(uuidPart).toMatch(UUID_REGEX)
  })

  it('should generate UUID-based log IDs', () => {
    const store = useGameStore.getState()

    store.initializePlayers([
      { name: 'Player', piece: 'hammer', isStalin: false }
    ])

    store.addLogEntry({ type: 'system', message: 'Test log entry' })

    const log = useGameStore.getState().gameLog
    expect(log.length).toBeGreaterThanOrEqual(1)
    const lastEntry = log[log.length - 1]
    expect(lastEntry.id).toMatch(/^log-/)
    const uuidPart = lastEntry.id.replace('log-', '')
    expect(uuidPart).toMatch(UUID_REGEX)
  })

  it('should generate unique IDs even when called rapidly', () => {
    const store = useGameStore.getState()

    store.initializePlayers([
      { name: 'Stalin', piece: null, isStalin: true },
      { name: 'Player', piece: 'hammer', isStalin: false }
    ])

    const player = useGameStore.getState().players.find(p => !p.isStalin)
    expect(player).toBeDefined()
    store.updatePlayer(player?.id ?? '', { rubles: 5000 })

    // Submit multiple bribes rapidly
    store.submitBribe(player?.id ?? '', 10, 'reason-1')
    store.submitBribe(player?.id ?? '', 20, 'reason-2')
    store.submitBribe(player?.id ?? '', 30, 'reason-3')

    const bribes = useGameStore.getState().pendingBribes
    expect(bribes).toHaveLength(3)

    const ids = bribes.map(b => b.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(3)
  })
})
