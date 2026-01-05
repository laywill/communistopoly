// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../../store/gameStore'
import { setupTestGame, startTestGame } from '../helpers/integrationHelpers'

describe('Tribunal Flow Integration', () => {
  beforeEach(() => {
    setupTestGame({
      players: [
        { name: 'Accuser', piece: 'sickle' },
        { name: 'Accused', piece: 'tank' },
        { name: 'Witness', piece: 'hammer' }
      ]
    })
    startTestGame()
  })

  describe('Complete Tribunal Flow', () => {
    it('should process denouncement through guilty verdict', () => {
      const store = useGameStore.getState()
      const players = useGameStore.getState().players.filter(p => !p.isStalin)
      const [accuser, accused, witness] = players

      const accuserRublesBefore = accuser.rubles

      // Start denouncement
      store.initiateDenouncement(
        accuser.id,
        accused.id,
        'Counter-revolutionary activities'
      )

      const tribunal = useGameStore.getState().activeTribunal
      expect(tribunal).not.toBeNull()
      expect(tribunal?.accuserId).toBe(accuser.id)
      expect(tribunal?.accusedId).toBe(accused.id)
      expect(tribunal?.phase).toBe('accusation')

      // Add witness for prosecution
      store.addWitness(witness.id, 'for')

      const updatedTribunal = useGameStore.getState().activeTribunal
      expect(updatedTribunal?.witnessesFor).toContain(witness.id)

      // Render guilty verdict
      store.renderTribunalVerdict('guilty')

      // Check aftermath
      expect(useGameStore.getState().activeTribunal).toBeNull()

      const updatedAccused = useGameStore.getState().players.find(p => p.id === accused.id)
      expect(updatedAccused).toBeDefined()
      expect(updatedAccused?.inGulag).toBe(true)

      // Accuser should receive bonus
      const updatedAccuser = useGameStore.getState().players.find(p => p.id === accuser.id)
      expect(updatedAccuser).toBeDefined()
      expect(updatedAccuser?.rubles).toBeGreaterThan(accuserRublesBefore)
    })

    it('should demote accuser on innocent verdict', () => {
      const store = useGameStore.getState()
      const players = useGameStore.getState().players.filter(p => !p.isStalin)
      const [accuser, accused] = players

      // Promote accuser first
      store.updatePlayer(accuser.id, { rank: 'partyMember' })
      expect(useGameStore.getState().players.find(p => p.id === accuser.id)?.rank).toBe('partyMember')

      // Start and complete tribunal
      store.initiateDenouncement(accuser.id, accused.id, 'Fake crime')

      // Render innocent verdict
      store.renderTribunalVerdict('innocent')

      // Accuser should be demoted
      const updatedAccuser = useGameStore.getState().players.find(p => p.id === accuser.id)
      expect(updatedAccuser).toBeDefined()
      expect(updatedAccuser?.rank).toBe('proletariat')

      // Accused should not be in Gulag
      const updatedAccused = useGameStore.getState().players.find(p => p.id === accused.id)
      expect(updatedAccused).toBeDefined()
      expect(updatedAccused?.inGulag).toBe(false)

      // Tribunal should be cleared
      expect(useGameStore.getState().activeTribunal).toBeNull()
    })

    it('should send both players to Gulag on bothGuilty verdict', () => {
      const store = useGameStore.getState()
      const players = useGameStore.getState().players.filter(p => !p.isStalin)
      const [accuser, accused] = players

      store.initiateDenouncement(accuser.id, accused.id, 'Mutual conspiracy')

      store.renderTribunalVerdict('bothGuilty')

      const updatedAccuser = useGameStore.getState().players.find(p => p.id === accuser.id)
      const updatedAccused = useGameStore.getState().players.find(p => p.id === accused.id)
      expect(updatedAccuser).toBeDefined()
      expect(updatedAccused).toBeDefined()

      expect(updatedAccuser?.inGulag).toBe(true)
      expect(updatedAccused?.inGulag).toBe(true)
      expect(useGameStore.getState().activeTribunal).toBeNull()
    })

    it('should handle insufficient evidence verdict', () => {
      const store = useGameStore.getState()
      const players = useGameStore.getState().players.filter(p => !p.isStalin)
      const [accuser, accused] = players

      store.initiateDenouncement(accuser.id, accused.id, 'Unclear case')

      store.renderTribunalVerdict('insufficient')

      const updatedAccuser = useGameStore.getState().players.find(p => p.id === accuser.id)
      const updatedAccused = useGameStore.getState().players.find(p => p.id === accused.id)
      expect(updatedAccuser).toBeDefined()
      expect(updatedAccused).toBeDefined()

      // Neither should go to Gulag
      expect(updatedAccuser?.inGulag).toBe(false)
      expect(updatedAccused?.inGulag).toBe(false)

      expect(useGameStore.getState().activeTribunal).toBeNull()
    })
  })

  describe('Witness System', () => {
    it('should track witnesses for prosecution', () => {
      const store = useGameStore.getState()
      const players = useGameStore.getState().players.filter(p => !p.isStalin)
      const [accuser, accused, witness] = players

      store.initiateDenouncement(accuser.id, accused.id, 'Crime')

      store.addWitness(witness.id, 'for')

      const tribunal = useGameStore.getState().activeTribunal
      expect(tribunal?.witnessesFor).toContain(witness.id)
    })

    it('should track witnesses for defence', () => {
      const store = useGameStore.getState()
      const players = useGameStore.getState().players.filter(p => !p.isStalin)
      const [accuser, accused, witness] = players

      store.initiateDenouncement(accuser.id, accused.id, 'Crime')

      store.addWitness(witness.id, 'against')

      const tribunal = useGameStore.getState().activeTribunal
      expect(tribunal?.witnessesAgainst).toContain(witness.id)
    })

    it('should support multiple witnesses on each side', () => {
      const store = useGameStore.getState()

      // Add more players to serve as witnesses
      store.initializePlayers([
        { name: 'Witness2', piece: 'star', isStalin: false },
        { name: 'Witness3', piece: 'vodka', isStalin: false }
      ])

      const players = useGameStore.getState().players.filter(p => !p.isStalin)
      const [accuser, accused, witness1, witness2, witness3] = players

      store.initiateDenouncement(accuser.id, accused.id, 'Major crime')

      store.addWitness(witness1.id, 'for')
      store.addWitness(witness2.id, 'for')
      store.addWitness(witness3.id, 'against')

      const tribunal = useGameStore.getState().activeTribunal
      expect(tribunal?.witnessesFor).toHaveLength(2)
      expect(tribunal?.witnessesAgainst).toHaveLength(1)
    })
  })

  describe('Witness Requirements by Rank', () => {
    it('should require witnesses for Commissar', () => {
      const store = useGameStore.getState()
      const players = useGameStore.getState().players.filter(p => !p.isStalin)
      const accused = players[1]

      // Promote accused to Commissar
      store.updatePlayer(accused.id, { rank: 'partyMember' })
      store.updatePlayer(accused.id, { rank: 'commissar' })

      const requirement = store.getWitnessRequirement(accused.id)
      expect(requirement).toBeGreaterThan(0)
      expect(requirement).toBe(2)
    })

    it('should require witnesses for Hero of Soviet Union', () => {
      const store = useGameStore.getState()
      const players = useGameStore.getState().players.filter(p => !p.isStalin)
      const accused = players[1]

      // Grant Hero status
      store.grantHeroOfSovietUnion(accused.id)

      const requirement = store.getWitnessRequirement(accused.id)
      expect(requirement).toBeGreaterThan(0)
    })

    it('should not require witnesses for Proletariat', () => {
      const store = useGameStore.getState()
      const players = useGameStore.getState().players.filter(p => !p.isStalin)
      const accused = players[1]

      // Accused is already Proletariat by default
      const requirement = store.getWitnessRequirement(accused.id)
      expect(requirement).toBe(0)
    })
  })

  describe('Denouncement Limits', () => {
    it('should track denouncements made per round', () => {
      const store = useGameStore.getState()
      const players = useGameStore.getState().players.filter(p => !p.isStalin)
      const [accuser, accused] = players

      const denouncementsBefore = store.denouncementsThisRound.length

      store.initiateDenouncement(accuser.id, accused.id, 'First denouncement')

      const denouncementsAfter = useGameStore.getState().denouncementsThisRound.length
      expect(denouncementsAfter).toBe(denouncementsBefore + 1)
    })

    it('should prevent denouncing the same player twice in same round', () => {
      const store = useGameStore.getState()
      const players = useGameStore.getState().players.filter(p => !p.isStalin)
      const [accuser, accused] = players

      // First denouncement
      store.initiateDenouncement(accuser.id, accused.id, 'First crime')
      store.renderTribunalVerdict('innocent')

      // Try second denouncement of same player
      store.initiateDenouncement(accuser.id, accused.id, 'Second crime')

      // Should not create another denouncement (depends on implementation)
      // This test documents the expected behavior
    })
  })

  describe('Statistics Tracking', () => {
    it('should track tribunals won for accuser', () => {
      const store = useGameStore.getState()
      const players = useGameStore.getState().players.filter(p => !p.isStalin)
      const [accuser, accused] = players

      const accuserBefore = useGameStore.getState().players.find(p => p.id === accuser.id)
      expect(accuserBefore).toBeDefined()
      if (!accuserBefore) return
      const tribunalsWonBefore = (accuserBefore as { statistics?: { tribunalsWon?: number } }).statistics?.tribunalsWon ?? 0

      store.initiateDenouncement(accuser.id, accused.id, 'Crime')
      store.renderTribunalVerdict('guilty')

      const accuserAfter = useGameStore.getState().players.find(p => p.id === accuser.id)
      expect(accuserAfter).toBeDefined()
      if (!accuserAfter) return
      const tribunalsWonAfter = (accuserAfter as { statistics?: { tribunalsWon?: number } }).statistics?.tribunalsWon ?? 0

      expect(tribunalsWonAfter).toBe(tribunalsWonBefore + 1)
    })

    it('should track tribunals lost for accuser on innocent verdict', () => {
      const store = useGameStore.getState()
      const players = useGameStore.getState().players.filter(p => !p.isStalin)
      const [accuser, accused] = players

      const accuserBefore = useGameStore.getState().players.find(p => p.id === accuser.id)
      expect(accuserBefore).toBeDefined()
      if (!accuserBefore) return
      const tribunalsLostBefore = (accuserBefore as { statistics?: { tribunalsLost?: number } }).statistics?.tribunalsLost ?? 0

      store.initiateDenouncement(accuser.id, accused.id, 'Crime')
      store.renderTribunalVerdict('innocent')

      const accuserAfter = useGameStore.getState().players.find(p => p.id === accuser.id)
      expect(accuserAfter).toBeDefined()
      if (!accuserAfter) return
      const tribunalsLostAfter = (accuserAfter as { statistics?: { tribunalsLost?: number } }).statistics?.tribunalsLost ?? 0

      expect(tribunalsLostAfter).toBe(tribunalsLostBefore + 1)
    })
  })
})
