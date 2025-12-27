// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../../store/gameStore'

describe('Tribunal Slice', () => {
  beforeEach(() => {
    // Reset store before each test
    useGameStore.getState().resetGame()
  })

  describe('Denouncement Eligibility', () => {
    it('should prevent denouncing yourself', () => {
      const { initializePlayers, initiateDenouncement } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'hammer', isStalin: false },
        { name: 'Stalin', piece: null, isStalin: true }
      ])

      const player1 = useGameStore.getState().players.find(p => p.name === 'Player 1')
      expect(player1).toBeDefined()

      initiateDenouncement(player1!.id, player1!.id, 'Being counter-revolutionary')

      // Should not create a tribunal
      const state = useGameStore.getState()
      expect(state.activeTribunal).toBeNull()
    })

    it('should prevent denouncing Stalin', () => {
      const { initializePlayers, initiateDenouncement } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'hammer', isStalin: false },
        { name: 'Stalin', piece: null, isStalin: true }
      ])

      const player1 = useGameStore.getState().players.find(p => p.name === 'Player 1')
      const stalin = useGameStore.getState().players.find(p => p.isStalin)
      expect(player1).toBeDefined()
      expect(stalin).toBeDefined()

      initiateDenouncement(player1!.id, stalin!.id, 'Being a tyrant')

      // Should send accuser to Gulag instead
      const state = useGameStore.getState()
      const updatedPlayer1 = state.players.find(p => p.id === player1!.id)
      expect(updatedPlayer1?.inGulag).toBe(true)
      expect(state.activeTribunal).toBeNull()
    })

    it('should prevent denouncing player in Gulag', () => {
      const { initializePlayers, sendToGulag, initiateDenouncement } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'hammer', isStalin: false },
        { name: 'Player 2', piece: 'sickle', isStalin: false },
        { name: 'Stalin', piece: null, isStalin: true }
      ])

      const player1 = useGameStore.getState().players.find(p => p.name === 'Player 1')
      const player2 = useGameStore.getState().players.find(p => p.name === 'Player 2')
      expect(player1).toBeDefined()
      expect(player2).toBeDefined()

      // Send Player 2 to Gulag
      sendToGulag(player2!.id, 'enemyOfState')

      // Try to denounce Player 2
      initiateDenouncement(player1!.id, player2!.id, 'Being in Gulag')

      // Should not create a tribunal
      const state = useGameStore.getState()
      expect(state.activeTribunal).toBeNull()
    })

    it('should enforce denouncement limit per round', () => {
      const { initializePlayers, initiateDenouncement, incrementRound } = useGameStore.getState()

      initializePlayers([
        { name: 'Player 1', piece: 'hammer', isStalin: false },
        { name: 'Player 2', piece: 'sickle', isStalin: false },
        { name: 'Player 3', piece: 'tank', isStalin: false },
        { name: 'Stalin', piece: null, isStalin: true }
      ])

      const player1 = useGameStore.getState().players.find(p => p.name === 'Player 1')
      const player2 = useGameStore.getState().players.find(p => p.name === 'Player 2')
      const player3 = useGameStore.getState().players.find(p => p.name === 'Player 3')
      expect(player1).toBeDefined()
      expect(player2).toBeDefined()
      expect(player3).toBeDefined()

      // First denouncement should work
      initiateDenouncement(player1!.id, player2!.id, 'First crime')
      let state = useGameStore.getState()
      expect(state.activeTribunal).not.toBeNull()
      expect(state.denouncementsThisRound.length).toBe(1)

      // Close the tribunal
      useGameStore.setState({ activeTribunal: null })

      // Second denouncement in same round should be blocked
      initiateDenouncement(player1!.id, player3!.id, 'Second crime')
      state = useGameStore.getState()
      expect(state.denouncementsThisRound.length).toBe(1) // Still 1

      // After incrementing round, should be able to denounce again
      incrementRound()
      initiateDenouncement(player1!.id, player3!.id, 'Second crime')
      state = useGameStore.getState()
      expect(state.activeTribunal).not.toBeNull()
      expect(state.denouncementsThisRound.length).toBe(1) // Reset to 1 for new round
    })

    it('should allow Commissar+ to denounce twice per round', () => {
      const { initializePlayers, updatePlayer, initiateDenouncement } = useGameStore.getState()

      initializePlayers([
        { name: 'Commissar', piece: 'hammer', isStalin: false },
        { name: 'Player 2', piece: 'sickle', isStalin: false },
        { name: 'Player 3', piece: 'tank', isStalin: false },
        { name: 'Stalin', piece: null, isStalin: true }
      ])

      const commissar = useGameStore.getState().players.find(p => p.name === 'Commissar')
      const player2 = useGameStore.getState().players.find(p => p.name === 'Player 2')
      const player3 = useGameStore.getState().players.find(p => p.name === 'Player 3')
      expect(commissar).toBeDefined()

      // Promote to Commissar
      updatePlayer(commissar!.id, { rank: 'commissar' })

      // First denouncement
      initiateDenouncement(commissar!.id, player2!.id, 'First crime')
      let state = useGameStore.getState()
      expect(state.activeTribunal).not.toBeNull()
      useGameStore.setState({ activeTribunal: null })

      // Second denouncement should also work for Commissar
      initiateDenouncement(commissar!.id, player3!.id, 'Second crime')
      state = useGameStore.getState()
      expect(state.activeTribunal).not.toBeNull()
      expect(state.denouncementsThisRound.length).toBe(2)
    })
  })

  describe('Witness Requirements', () => {
    it('should require 2 witnesses for Commissar', () => {
      const { initializePlayers, updatePlayer, getWitnessRequirement } = useGameStore.getState()

      initializePlayers([
        { name: 'Commissar', piece: 'hammer', isStalin: false },
        { name: 'Stalin', piece: null, isStalin: true }
      ])

      const commissar = useGameStore.getState().players.find(p => p.name === 'Commissar')
      updatePlayer(commissar!.id, { rank: 'commissar' })

      const requirement = getWitnessRequirement(commissar!.id)
      expect(requirement.required).toBe(2)
    })

    it('should require unanimous witnesses for Inner Circle', () => {
      const { initializePlayers, updatePlayer, getWitnessRequirement } = useGameStore.getState()

      initializePlayers([
        { name: 'Inner Circle', piece: 'hammer', isStalin: false },
        { name: 'Stalin', piece: null, isStalin: true }
      ])

      const innerCircle = useGameStore.getState().players.find(p => p.name === 'Inner Circle')
      updatePlayer(innerCircle!.id, { rank: 'innerCircle' })

      const requirement = getWitnessRequirement(innerCircle!.id)
      expect(requirement.required).toBe('unanimous')
    })

    it('should waive witnesses if accused is under suspicion', () => {
      const { initializePlayers, updatePlayer, getWitnessRequirement } = useGameStore.getState()

      initializePlayers([
        { name: 'Commissar', piece: 'hammer', isStalin: false },
        { name: 'Stalin', piece: null, isStalin: true }
      ])

      const commissar = useGameStore.getState().players.find(p => p.name === 'Commissar')
      updatePlayer(commissar!.id, { rank: 'commissar', underSuspicion: true })

      const requirement = getWitnessRequirement(commissar!.id)
      expect(requirement.required).toBe(0)
      expect(requirement.reason).toContain('under suspicion')
    })

    it('should calculate enough witnesses correctly', () => {
      const { initializePlayers, initiateDenouncement, addWitness, hasEnoughWitnesses, updatePlayer } = useGameStore.getState()

      initializePlayers([
        { name: 'Accuser', piece: 'hammer', isStalin: false },
        { name: 'Commissar', piece: 'sickle', isStalin: false },
        { name: 'Witness 1', piece: 'tank', isStalin: false },
        { name: 'Witness 2', piece: 'vodkaBottle', isStalin: false },
        { name: 'Stalin', piece: null, isStalin: true }
      ])

      const accuser = useGameStore.getState().players.find(p => p.name === 'Accuser')
      const commissar = useGameStore.getState().players.find(p => p.name === 'Commissar')
      const witness1 = useGameStore.getState().players.find(p => p.name === 'Witness 1')
      const witness2 = useGameStore.getState().players.find(p => p.name === 'Witness 2')

      updatePlayer(commissar!.id, { rank: 'commissar' })

      // Start tribunal against Commissar
      initiateDenouncement(accuser!.id, commissar!.id, 'Being corrupt')

      // Initially, not enough witnesses
      expect(hasEnoughWitnesses()).toBe(false)

      // Add 1 witness - still not enough
      addWitness(witness1!.id, 'for')
      expect(hasEnoughWitnesses()).toBe(false)

      // Add 2nd witness - now enough
      addWitness(witness2!.id, 'for')
      expect(hasEnoughWitnesses()).toBe(true)
    })
  })

  describe('Verdicts', () => {
    it('should send accused to Gulag on guilty', () => {
      const { initializePlayers, initiateDenouncement, renderTribunalVerdict } = useGameStore.getState()

      initializePlayers([
        { name: 'Accuser', piece: 'hammer', isStalin: false },
        { name: 'Accused', piece: 'sickle', isStalin: false },
        { name: 'Stalin', piece: null, isStalin: true }
      ])

      const accuser = useGameStore.getState().players.find(p => p.name === 'Accuser')
      const accused = useGameStore.getState().players.find(p => p.name === 'Accused')

      initiateDenouncement(accuser!.id, accused!.id, 'Treason')
      renderTribunalVerdict('guilty')

      const state = useGameStore.getState()
      const updatedAccused = state.players.find(p => p.id === accused!.id)
      expect(updatedAccused?.inGulag).toBe(true)
    })

    it('should award informant bonus on guilty', () => {
      const { initializePlayers, initiateDenouncement, renderTribunalVerdict } = useGameStore.getState()

      initializePlayers([
        { name: 'Accuser', piece: 'hammer', isStalin: false },
        { name: 'Accused', piece: 'sickle', isStalin: false },
        { name: 'Stalin', piece: null, isStalin: true }
      ])

      const accuser = useGameStore.getState().players.find(p => p.name === 'Accuser')
      const accused = useGameStore.getState().players.find(p => p.name === 'Accused')
      const initialRubles = accuser!.rubles

      initiateDenouncement(accuser!.id, accused!.id, 'Treason')
      renderTribunalVerdict('guilty')

      const state = useGameStore.getState()
      const updatedAccuser = state.players.find(p => p.id === accuser!.id)
      expect(updatedAccuser?.rubles).toBe(initialRubles + 100)
    })

    it('should demote accuser on innocent', () => {
      const { initializePlayers, updatePlayer, initiateDenouncement, renderTribunalVerdict } = useGameStore.getState()

      initializePlayers([
        { name: 'Accuser', piece: 'hammer', isStalin: false },
        { name: 'Accused', piece: 'sickle', isStalin: false },
        { name: 'Stalin', piece: null, isStalin: true }
      ])

      const accuser = useGameStore.getState().players.find(p => p.name === 'Accuser')
      const accused = useGameStore.getState().players.find(p => p.name === 'Accused')

      updatePlayer(accuser!.id, { rank: 'commissar' })

      initiateDenouncement(accuser!.id, accused!.id, 'False accusation')
      renderTribunalVerdict('innocent')

      const state = useGameStore.getState()
      const updatedAccuser = state.players.find(p => p.id === accuser!.id)
      expect(updatedAccuser?.rank).toBe('partyMember')
    })

    it('should send both to Gulag on bothGuilty', () => {
      const { initializePlayers, initiateDenouncement, renderTribunalVerdict } = useGameStore.getState()

      initializePlayers([
        { name: 'Accuser', piece: 'vodkaBottle', isStalin: false },
        { name: 'Accused', piece: 'sickle', isStalin: false },
        { name: 'Stalin', piece: null, isStalin: true }
      ])

      const accuser = useGameStore.getState().players.find(p => p.name === 'Accuser')
      const accused = useGameStore.getState().players.find(p => p.name === 'Accused')

      initiateDenouncement(accuser!.id, accused!.id, 'Conspiracy')
      renderTribunalVerdict('bothGuilty')

      const state = useGameStore.getState()
      const updatedAccuser = state.players.find(p => p.id === accuser!.id)
      const updatedAccused = state.players.find(p => p.id === accused!.id)
      expect(updatedAccuser?.inGulag).toBe(true)
      expect(updatedAccused?.inGulag).toBe(true)
    })

    it('should mark accused under suspicion on insufficientEvidence', () => {
      const { initializePlayers, initiateDenouncement, renderTribunalVerdict } = useGameStore.getState()

      initializePlayers([
        { name: 'Accuser', piece: 'hammer', isStalin: false },
        { name: 'Accused', piece: 'sickle', isStalin: false },
        { name: 'Stalin', piece: null, isStalin: true }
      ])

      const accuser = useGameStore.getState().players.find(p => p.name === 'Accuser')
      const accused = useGameStore.getState().players.find(p => p.name === 'Accused')

      initiateDenouncement(accuser!.id, accused!.id, 'Suspicious behavior')
      renderTribunalVerdict('insufficient')

      const state = useGameStore.getState()
      const updatedAccused = state.players.find(p => p.id === accused!.id)
      expect(updatedAccused?.underSuspicion).toBe(true)
    })
  })

  describe('Lenin Statue Protection', () => {
    it('should prevent lower ranks from denouncing Lenin Statue', () => {
      const { initializePlayers, initiateDenouncement, updatePlayer } = useGameStore.getState()

      initializePlayers([
        { name: 'Proletariat', piece: 'hammer', isStalin: false },
        { name: 'Lenin', piece: 'statueOfLenin', isStalin: false },
        { name: 'Stalin', piece: null, isStalin: true }
      ])

      const proletariat = useGameStore.getState().players.find(p => p.name === 'Proletariat')
      const lenin = useGameStore.getState().players.find(p => p.name === 'Lenin')

      // Set Lenin to higher rank
      updatePlayer(lenin!.id, { rank: 'commissar' })

      initiateDenouncement(proletariat!.id, lenin!.id, 'Being too tall')

      const state = useGameStore.getState()
      expect(state.activeTribunal).toBeNull()
    })

    it('should allow equal or higher ranks to denounce Lenin Statue', () => {
      const { initializePlayers, initiateDenouncement, updatePlayer } = useGameStore.getState()

      initializePlayers([
        { name: 'Commissar', piece: 'hammer', isStalin: false },
        { name: 'Lenin', piece: 'statueOfLenin', isStalin: false },
        { name: 'Stalin', piece: null, isStalin: true }
      ])

      const commissar = useGameStore.getState().players.find(p => p.name === 'Commissar')
      const lenin = useGameStore.getState().players.find(p => p.name === 'Lenin')

      // Both at Commissar rank
      updatePlayer(commissar!.id, { rank: 'commissar' })
      updatePlayer(lenin!.id, { rank: 'commissar' })

      initiateDenouncement(commissar!.id, lenin!.id, 'Being too tall')

      const state = useGameStore.getState()
      expect(state.activeTribunal).not.toBeNull()
    })
  })

  describe('Tribunal Flow', () => {
    it('should create tribunal with correct initial phase', () => {
      const { initializePlayers, initiateDenouncement } = useGameStore.getState()

      initializePlayers([
        { name: 'Accuser', piece: 'hammer', isStalin: false },
        { name: 'Accused', piece: 'sickle', isStalin: false },
        { name: 'Stalin', piece: null, isStalin: true }
      ])

      const accuser = useGameStore.getState().players.find(p => p.name === 'Accuser')
      const accused = useGameStore.getState().players.find(p => p.name === 'Accused')

      initiateDenouncement(accuser!.id, accused!.id, 'Test crime')

      const state = useGameStore.getState()
      expect(state.activeTribunal).not.toBeNull()
      expect(state.activeTribunal?.phase).toBe('accusation')
      expect(state.activeTribunal?.crime).toBe('Test crime')
    })

    it('should advance tribunal phases correctly', () => {
      const { initializePlayers, initiateDenouncement, advanceTribunalPhase } = useGameStore.getState()

      initializePlayers([
        { name: 'Accuser', piece: 'hammer', isStalin: false },
        { name: 'Accused', piece: 'sickle', isStalin: false },
        { name: 'Stalin', piece: null, isStalin: true }
      ])

      const accuser = useGameStore.getState().players.find(p => p.name === 'Accuser')
      const accused = useGameStore.getState().players.find(p => p.name === 'Accused')

      initiateDenouncement(accuser!.id, accused!.id, 'Test crime')

      let state = useGameStore.getState()
      expect(state.activeTribunal?.phase).toBe('accusation')

      advanceTribunalPhase()
      state = useGameStore.getState()
      expect(state.activeTribunal?.phase).toBe('defence')

      advanceTribunalPhase()
      state = useGameStore.getState()
      expect(state.activeTribunal?.phase).toBe('witnesses')

      advanceTribunalPhase()
      state = useGameStore.getState()
      expect(state.activeTribunal?.phase).toBe('judgement')
    })

    it('should prevent witnessing your own trial', () => {
      const { initializePlayers, initiateDenouncement, addWitness } = useGameStore.getState()

      initializePlayers([
        { name: 'Accuser', piece: 'hammer', isStalin: false },
        { name: 'Accused', piece: 'sickle', isStalin: false },
        { name: 'Stalin', piece: null, isStalin: true }
      ])

      const accuser = useGameStore.getState().players.find(p => p.name === 'Accuser')
      const accused = useGameStore.getState().players.find(p => p.name === 'Accused')

      initiateDenouncement(accuser!.id, accused!.id, 'Test crime')

      // Try to add accuser as witness
      addWitness(accuser!.id, 'for')

      const state = useGameStore.getState()
      expect(state.activeTribunal?.witnessesFor).toHaveLength(0)

      // Try to add accused as witness
      addWitness(accused!.id, 'against')

      const state2 = useGameStore.getState()
      expect(state2.activeTribunal?.witnessesAgainst).toHaveLength(0)
    })

    it('should prevent witnessing for both sides', () => {
      const { initializePlayers, initiateDenouncement, addWitness } = useGameStore.getState()

      initializePlayers([
        { name: 'Accuser', piece: 'hammer', isStalin: false },
        { name: 'Accused', piece: 'sickle', isStalin: false },
        { name: 'Witness', piece: 'tank', isStalin: false },
        { name: 'Stalin', piece: null, isStalin: true }
      ])

      const accuser = useGameStore.getState().players.find(p => p.name === 'Accuser')
      const accused = useGameStore.getState().players.find(p => p.name === 'Accused')
      const witness = useGameStore.getState().players.find(p => p.name === 'Witness')

      initiateDenouncement(accuser!.id, accused!.id, 'Test crime')

      // Add witness for accuser
      addWitness(witness!.id, 'for')
      let state = useGameStore.getState()
      expect(state.activeTribunal?.witnessesFor).toHaveLength(1)

      // Try to add same witness for accused
      addWitness(witness!.id, 'against')
      state = useGameStore.getState()
      expect(state.activeTribunal?.witnessesAgainst).toHaveLength(0)
    })
  })
})
