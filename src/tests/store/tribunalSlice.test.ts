import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../../store/gameStore'

describe('Tribunal Slice', () => {
  beforeEach(() => {
    // Reset store to initial state
    useGameStore.getState().resetGame()
  })

  const setupTestPlayers = () => {
    const store = useGameStore.getState()
    store.setGamePhase('setup')
    store.initializePlayers([
      { name: 'Player 1', piece: 'breadline', isStalin: false },
      { name: 'Player 2', piece: 'vodka', isStalin: false },
      { name: 'Player 3', piece: 'ironCurtain', isStalin: false },
      { name: 'Stalin', piece: null, isStalin: true }
    ])
    store.setGamePhase('playing')
    // Get fresh state after initialization
    return useGameStore.getState().players
  }

  describe('Denouncement Eligibility', () => {
    it('should prevent denouncing yourself', () => {
      const players = setupTestPlayers()
      const player = players.find(p => !p.isStalin)
      expect(player).toBeDefined()
      if (!player) throw new Error('Player not found')

      const store = useGameStore.getState()
      const result = store.canDenounce(player.id, player.id)

      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('yourself')
    })

    it('should prevent denouncing Stalin', () => {
      const players = setupTestPlayers()
      const player = players.find(p => !p.isStalin)
      expect(player).toBeDefined()
      if (!player) throw new Error('Player not found')

      const stalin = players.find(p => p.isStalin)
      expect(stalin).toBeDefined()
      if (!stalin) throw new Error('Stalin not found')

      const store = useGameStore.getState()
      const result = store.canDenounce(player.id, stalin.id)

      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Stalin')
    })

    it('should prevent denouncing someone in Gulag', () => {
      const players = setupTestPlayers()
      const player1 = players[0]
      const player2 = players[1]

      const store = useGameStore.getState()

      // Put player2 in Gulag
      store.sendToGulag(player2.id, 'enemyOfState')

      const result = store.canDenounce(player1.id, player2.id)

      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Gulag')
    })

    it('should enforce denouncement limit per round', () => {
      const players = setupTestPlayers()
      const player1 = players[0]
      const player2 = players[1]
      const player3 = players[2]

      const store = useGameStore.getState()

      // First denouncement should work
      const result1 = store.canDenounce(player1.id, player2.id)
      expect(result1.allowed).toBe(true)

      // Make the denouncement
      store.denouncePlayer(player1.id, player2.id, 'Counter-revolutionary activity')

      // Second denouncement should fail (for non-Commissar)
      const result2 = store.canDenounce(player1.id, player3.id)
      expect(result2.allowed).toBe(false)
      expect(result2.reason).toContain('limit')
    })

    it('should allow Commissar to denounce twice per round', () => {
      const players = setupTestPlayers()
      const player1 = players[0]
      const player2 = players[1]
      const player3 = players[2]

      const store = useGameStore.getState()

      // Promote player1 to Commissar
      store.updatePlayer(player1.id, { rank: 'commissar' })

      // First denouncement
      const result1 = store.canDenounce(player1.id, player2.id)
      expect(result1.allowed).toBe(true)
      store.denouncePlayer(player1.id, player2.id, 'Test crime 1')
      store.cancelTribunal() // Clear the tribunal so we can denounce again

      // Second denouncement should work for Commissar
      const result2 = store.canDenounce(player1.id, player3.id)
      expect(result2.allowed).toBe(true)
    })

    it('should protect Lenin Statue from lower rank denouncements', () => {
      const players = setupTestPlayers()
      const player1 = players[0]
      const player2 = players[1]

      const store = useGameStore.getState()

      // Set player2 as Lenin Statue at Party Member rank
      store.updatePlayer(player2.id, { piece: 'leninStatue', rank: 'partyMember' })

      // player1 (Proletariat) tries to denounce Lenin Statue - should fail
      const result1 = store.canDenounce(player1.id, player2.id)
      expect(result1.allowed).toBe(false)
      expect(result1.reason).toContain('Lenin Statue')

      // Promote player1 to Party Member - should now work
      store.updatePlayer(player1.id, { rank: 'partyMember' })
      const result2 = store.canDenounce(player1.id, player2.id)
      expect(result2.allowed).toBe(true)
    })

    it('should prevent denouncement when tribunal is in progress', () => {
      const players = setupTestPlayers()
      const player1 = players[0]
      const player2 = players[1]
      const player3 = players[2]

      const store = useGameStore.getState()

      // Start a tribunal
      store.denouncePlayer(player1.id, player2.id, 'Test crime')

      // Try to start another tribunal - should fail
      const result = store.canDenounce(player3.id, player1.id)
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('tribunal')
    })
  })

  describe('Witness Requirements', () => {
    it('should require 0 witnesses for Proletariat', () => {
      setupTestPlayers()
      const store = useGameStore.getState()

      expect(store.getWitnessRequirement('proletariat')).toBe(0)
    })

    it('should require 0 witnesses for Party Member', () => {
      setupTestPlayers()
      const store = useGameStore.getState()

      expect(store.getWitnessRequirement('partyMember')).toBe(0)
    })

    it('should require 2 witnesses for Commissar', () => {
      setupTestPlayers()
      const store = useGameStore.getState()

      expect(store.getWitnessRequirement('commissar')).toBe(2)
    })

    it('should require unanimous for Inner Circle', () => {
      setupTestPlayers()
      const store = useGameStore.getState()

      expect(store.getWitnessRequirement('innerCircle')).toBe(-1)
    })

    it('should waive witnesses if accused is under suspicion', () => {
      const players = setupTestPlayers()
      const player1 = players[0]
      const player2 = players[1]

      const store = useGameStore.getState()

      // Set player2 as Commissar (normally requires 2 witnesses)
      store.updatePlayer(player2.id, { rank: 'commissar' })

      // Start tribunal
      store.denouncePlayer(player1.id, player2.id, 'Test crime')

      // Without under suspicion, should not have enough witnesses
      expect(store.hasEnoughWitnesses()).toBe(false)

      // Mark as under suspicion
      store.updatePlayer(player2.id, { underSuspicion: true })

      // Should now have enough witnesses
      expect(store.hasEnoughWitnesses()).toBe(true)
    })
  })

  describe('Verdicts', () => {
    it('should send accused to Gulag on guilty', () => {
      const players = setupTestPlayers()
      const player1 = players[0]
      const player2 = players[1]

      let store = useGameStore.getState()

      // Start tribunal
      store.denouncePlayer(player1.id, player2.id, 'Counter-revolutionary activity')

      // Get fresh state
      store = useGameStore.getState()

      // Render guilty verdict
      store.renderVerdict('guilty')

      // Check accused is in Gulag - get fresh state
      const updatedStore = useGameStore.getState()
      const updatedPlayer2 = updatedStore.players.find(p => p.id === player2.id)
      expect(updatedPlayer2).toBeDefined()
      if (!updatedPlayer2) throw new Error('Player 2 not found')
      expect(updatedPlayer2.inGulag).toBe(true)
    })

    it('should award informant bonus on guilty', () => {
      const players = setupTestPlayers()
      const player1 = players[0]
      const player2 = players[1]

      let store = useGameStore.getState()
      const initialRubles = player1.rubles

      // Start tribunal
      store.denouncePlayer(player1.id, player2.id, 'Test crime')

      // Get fresh state
      store = useGameStore.getState()

      // Render guilty verdict
      store.renderVerdict('guilty')

      // Check accuser gets +100₽ - get fresh state
      const updatedStore = useGameStore.getState()
      const updatedPlayer1 = updatedStore.players.find(p => p.id === player1.id)
      expect(updatedPlayer1).toBeDefined()
      if (!updatedPlayer1) throw new Error('Player 1 not found')
      expect(updatedPlayer1.rubles).toBe(initialRubles + 100)
    })

    it('should demote accuser on innocent', () => {
      const players = setupTestPlayers()
      const player1 = players[0]
      const player2 = players[1]

      const store = useGameStore.getState()

      // Promote player1 to Party Member first
      store.updatePlayer(player1.id, { rank: 'partyMember' })

      // Start tribunal
      store.denouncePlayer(player1.id, player2.id, 'False accusation')

      // Render innocent verdict
      store.renderVerdict('innocent')

      // Check accuser was demoted
      const updatedPlayer1 = store.players.find(p => p.id === player1.id)
      expect(updatedPlayer1).toBeDefined()
      if (!updatedPlayer1) throw new Error('Player 1 not found')
      expect(updatedPlayer1.rank).toBe('proletariat')
    })

    it('should send both to Gulag on bothGuilty', () => {
      const players = setupTestPlayers()
      const player1 = players[0]
      const player2 = players[1]

      let store = useGameStore.getState()

      // Start tribunal
      store.denouncePlayer(player1.id, player2.id, 'Both guilty')

      // Get fresh state
      store = useGameStore.getState()

      // Render bothGuilty verdict
      store.renderVerdict('bothGuilty')

      // Check both are in Gulag - get fresh state
      const updatedStore = useGameStore.getState()
      const updatedPlayer1 = updatedStore.players.find(p => p.id === player1.id)
      expect(updatedPlayer1).toBeDefined()
      if (!updatedPlayer1) throw new Error('Player 1 not found')

      const updatedPlayer2 = updatedStore.players.find(p => p.id === player2.id)
      expect(updatedPlayer2).toBeDefined()
      if (!updatedPlayer2) throw new Error('Player 2 not found')

      expect(updatedPlayer1.inGulag).toBe(true)
      expect(updatedPlayer2.inGulag).toBe(true)
    })

    it('should mark accused under suspicion on insufficientEvidence', () => {
      const players = setupTestPlayers()
      const player1 = players[0]
      const player2 = players[1]

      let store = useGameStore.getState()

      // Start tribunal
      store.denouncePlayer(player1.id, player2.id, 'Insufficient proof')

      // Get fresh state
      store = useGameStore.getState()

      // Render insufficientEvidence verdict
      store.renderVerdict('insufficientEvidence')

      // Check accused is under suspicion - get fresh state
      const updatedStore = useGameStore.getState()
      const updatedPlayer2 = updatedStore.players.find(p => p.id === player2.id)
      expect(updatedPlayer2).toBeDefined()
      if (!updatedPlayer2) throw new Error('Player 2 not found')
      expect(updatedPlayer2.underSuspicion).toBe(true)
    })

    it('should clear tribunal after verdict', () => {
      const players = setupTestPlayers()
      const player1 = players[0]
      const player2 = players[1]

      let store = useGameStore.getState()

      // Start tribunal
      store.denouncePlayer(player1.id, player2.id, 'Test crime')

      // Get fresh state to check tribunal was created
      store = useGameStore.getState()
      expect(store.currentTribunal).not.toBeNull()

      // Render verdict
      store.renderVerdict('guilty')

      // Check tribunal is cleared - get fresh state
      store = useGameStore.getState()
      expect(store.currentTribunal).toBeNull()
    })
  })

  describe('Tribunal Flow', () => {
    it('should progress through phases correctly', () => {
      const players = setupTestPlayers()
      const player1 = players[0]
      const player2 = players[1]

      let store = useGameStore.getState()

      // Start tribunal
      store.startTribunal({
        accuserId: player1.id,
        accusedId: player2.id,
        crime: 'Test crime'
      })

      // Get fresh state
      store = useGameStore.getState()
      expect(store.currentTribunal?.phase).toBe('accusation')

      // Submit accusation
      store.submitAccusation('I saw them steal from the collective!')
      store = useGameStore.getState()
      expect(store.currentTribunal?.phase).toBe('defense')
      expect(store.currentTribunal?.accusationStatement).toBe('I saw them steal from the collective!')

      // Submit defense
      store.submitDefense('I did no such thing!')
      store = useGameStore.getState()
      expect(store.currentTribunal?.phase).toBe('witnesses')
      expect(store.currentTribunal?.defenseStatement).toBe('I did no such thing!')

      // Advance to verdict
      store.advancePhase()
      store = useGameStore.getState()
      expect(store.currentTribunal?.phase).toBe('verdict')
    })

    it('should add witnesses correctly', () => {
      const players = setupTestPlayers()
      const player1 = players[0]
      const player2 = players[1]
      const player3 = players[2]

      let store = useGameStore.getState()

      // Start tribunal
      store.startTribunal({
        accuserId: player1.id,
        accusedId: player2.id,
        crime: 'Test crime'
      })

      // Get fresh state
      store = useGameStore.getState()

      // Add prosecution witness
      const result1 = store.addWitness(player3.id, 'prosecution')
      expect(result1).toBe(true)

      // Get fresh state to check witness was added
      store = useGameStore.getState()
      expect(store.currentTribunal?.witnesses.prosecution).toContain(player3.id)

      // Try to add same witness to defense - should fail
      const result2 = store.addWitness(player3.id, 'defense')
      expect(result2).toBe(false)
    })

    it('should prevent accuser/accused from being witnesses', () => {
      const players = setupTestPlayers()
      const player1 = players[0]
      const player2 = players[1]

      const store = useGameStore.getState()

      // Start tribunal
      store.startTribunal({
        accuserId: player1.id,
        accusedId: player2.id,
        crime: 'Test crime'
      })

      // Try to add accuser as witness
      const result1 = store.addWitness(player1.id, 'prosecution')
      expect(result1).toBe(false)

      // Try to add accused as witness
      const result2 = store.addWitness(player2.id, 'defense')
      expect(result2).toBe(false)
    })

    it('should track player involvement in tribunal', () => {
      const players = setupTestPlayers()
      const player1 = players[0]
      const player2 = players[1]
      const player3 = players[2]

      const store = useGameStore.getState()

      // Start tribunal
      store.startTribunal({
        accuserId: player1.id,
        accusedId: player2.id,
        crime: 'Test crime'
      })

      // Add witness
      store.addWitness(player3.id, 'prosecution')

      // Check involvement
      expect(store.isPlayerInvolvedInTribunal(player1.id)).toBe(true) // Accuser
      expect(store.isPlayerInvolvedInTribunal(player2.id)).toBe(true) // Accused
      expect(store.isPlayerInvolvedInTribunal(player3.id)).toBe(true) // Witness
    })
  })

  describe('Denouncement Counter Reset', () => {
    it.skip('should reset denouncement counter each round (NOT IMPLEMENTED)', () => {
      const players = setupTestPlayers()
      const player1 = players[0]
      const player2 = players[1]

      let store = useGameStore.getState()

      // Make a denouncement
      store.denouncePlayer(player1.id, player2.id, 'Test crime')

      // Check counter is incremented - get fresh state
      store = useGameStore.getState()
      let updatedPlayer1 = store.players.find(p => p.id === player1.id)
      expect(updatedPlayer1).toBeDefined()
      if (!updatedPlayer1) throw new Error('Player 1 not found')
      expect(updatedPlayer1.denouncementsMadeThisRound).toBe(1)

      // Cancel tribunal
      store.cancelTribunal()

      // Get fresh state
      store = useGameStore.getState()

      // Try to denounce again - should fail (limit reached)
      const canDenounce1 = store.canDenounce(player1.id, player2.id)
      expect(canDenounce1.allowed).toBe(false)

      // Increment round
      store.incrementRound()

      // Check counter is reset - get fresh state
      store = useGameStore.getState()
      updatedPlayer1 = store.players.find(p => p.id === player1.id)
      expect(updatedPlayer1).toBeDefined()
      if (!updatedPlayer1) throw new Error('Player 1 not found')
      expect(updatedPlayer1.denouncementsMadeThisRound).toBe(0)

      // Should be able to denounce again
      const canDenounce2 = store.canDenounce(player1.id, player2.id)
      expect(canDenounce2.allowed).toBe(true)
    })
  })
})
