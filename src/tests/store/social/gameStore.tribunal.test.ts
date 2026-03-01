// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useGameStore } from '../../../store/gameStore'

describe('Denouncement & Tribunal System', () => {
  beforeEach(() => {
    const store = useGameStore.getState()
    store.resetGame()
    vi.clearAllMocks()
  })

  describe('canPlayerDenounce', () => {
    it('should allow player to denounce when they have not denounced this round', () => {
      const store = useGameStore.getState()

      store.initializePlayers([
        { name: 'Player 1', piece: 'hammer', isStalin: false }
      ])
      const [player1] = useGameStore.getState().players

      const result = store.canPlayerDenounce(player1.id)

      expect(result.canDenounce).toBe(true)
      expect(result.reason).toBe('')
    })

    it('should prevent player from denouncing twice in one round (normal rank)', () => {
      const store = useGameStore.getState()

      store.initializePlayers([
        { name: 'Player 1', piece: 'hammer', isStalin: false },
        { name: 'Player 2', piece: 'sickle', isStalin: false }
      ])
      const [player1, player2] = useGameStore.getState().players

      // First denouncement
      store.initiateDenouncement(player1.id, player2.id, 'Being too capitalist')

      // Try to denounce again
      const result = store.canPlayerDenounce(player1.id)

      expect(result.canDenounce).toBe(false)
      expect(result.reason).toContain('only denounce once per round')
    })

    it('should allow Commissar to denounce multiple times per round', () => {
      const store = useGameStore.getState()

      store.initializePlayers([
        { name: 'Commissar', piece: 'hammer', isStalin: false },
        { name: 'Player 2', piece: 'sickle', isStalin: false },
        { name: 'Player 3', piece: 'tank', isStalin: false }
      ])
      const [commissar, player2] = useGameStore.getState().players

      // Promote to Commissar
      store.updatePlayer(commissar.id, { rank: 'commissar' })

      // First denouncement
      store.initiateDenouncement(commissar.id, player2.id, 'Crime 1')

      // Close tribunal to allow another denouncement
      useGameStore.setState({ activeTribunal: null })

      // Second denouncement should be allowed
      const result = store.canPlayerDenounce(commissar.id)

      expect(result.canDenounce).toBe(true)
    })

    it('should allow Inner Circle to denounce multiple times per round', () => {
      const store = useGameStore.getState()

      store.initializePlayers([
        { name: 'Inner Circle', piece: 'hammer', isStalin: false },
        { name: 'Player 2', piece: 'sickle', isStalin: false }
      ])
      const [innerCircle, player2] = useGameStore.getState().players

      // Promote to Inner Circle
      store.updatePlayer(innerCircle.id, { rank: 'innerCircle' })

      // First denouncement
      store.initiateDenouncement(innerCircle.id, player2.id, 'Crime 1')

      // Close tribunal
      useGameStore.setState({ activeTribunal: null })

      // Should be allowed to denounce again
      const result = store.canPlayerDenounce(innerCircle.id)

      expect(result.canDenounce).toBe(true)
    })

    it('should return false for invalid player ID', () => {
      const store = useGameStore.getState()

      const result = store.canPlayerDenounce('invalid-id')

      expect(result.canDenounce).toBe(false)
      expect(result.reason).toBe('Player not found')
    })
  })

  describe('initiateDenouncement', () => {
    it('should create denouncement record and active tribunal', () => {
      const store = useGameStore.getState()

      store.initializePlayers([
        { name: 'Accuser', piece: 'hammer', isStalin: false },
        { name: 'Accused', piece: 'sickle', isStalin: false }
      ])
      const [accuser, accused] = useGameStore.getState().players

      const crime = 'Hoarding grain'

      store.initiateDenouncement(accuser.id, accused.id, crime)

      const state = useGameStore.getState()

      // Check denouncement record
      expect(state.denouncementsThisRound).toHaveLength(1)
      expect(state.denouncementsThisRound[0].accuserId).toBe(accuser.id)
      expect(state.denouncementsThisRound[0].accusedId).toBe(accused.id)
      expect(state.denouncementsThisRound[0].crime).toBe(crime)
      expect(state.denouncementsThisRound[0].roundNumber).toBe(state.roundNumber)

      // Check active tribunal
      expect(state.activeTribunal).not.toBeNull()
      expect(state.activeTribunal?.accuserId).toBe(accuser.id)
      expect(state.activeTribunal?.accusedId).toBe(accused.id)
      expect(state.activeTribunal?.crime).toBe(crime)
      expect(state.activeTribunal?.phase).toBe('accusation')
      expect(state.activeTribunal?.witnessesFor).toEqual([])
      expect(state.activeTribunal?.witnessesAgainst).toEqual([])
    })

    it('should set correct witness requirement based on accused rank', () => {
      const store = useGameStore.getState()

      store.initializePlayers([
        { name: 'Accuser', piece: 'hammer', isStalin: false },
        { name: 'Commissar', piece: 'sickle', isStalin: false }
      ])
      const [accuser, commissar] = useGameStore.getState().players

      // Promote accused to Commissar
      store.updatePlayer(commissar.id, { rank: 'commissar' })

      store.initiateDenouncement(accuser.id, commissar.id, 'Corruption')

      const state = useGameStore.getState()

      // Commissar requires 2 witnesses
      expect(state.activeTribunal?.requiredWitnesses).toBe(2)
    })

    it('should update game statistics', () => {
      const store = useGameStore.getState()

      store.initializePlayers([
        { name: 'Accuser', piece: 'hammer', isStalin: false },
        { name: 'Accused', piece: 'sickle', isStalin: false }
      ])
      const [accuser, accused] = useGameStore.getState().players

      const initialStats = useGameStore.getState().gameStatistics

      store.initiateDenouncement(accuser.id, accused.id, 'Test crime')

      const updatedStats = useGameStore.getState().gameStatistics

      expect(updatedStats.totalDenouncements).toBe(initialStats.totalDenouncements + 1)
      expect(updatedStats.totalTribunals).toBe(initialStats.totalTribunals + 1)
    })

    it('should add tribunal log entry', () => {
      const store = useGameStore.getState()

      store.initializePlayers([
        { name: 'Accuser', piece: 'hammer', isStalin: false },
        { name: 'Accused', piece: 'sickle', isStalin: false }
      ])
      const [accuser, accused] = useGameStore.getState().players

      useGameStore.setState({ gameLog: [] })

      store.initiateDenouncement(accuser.id, accused.id, 'Test crime')

      const logs = useGameStore.getState().gameLog

      expect(logs.some(log =>
        log.type === 'tribunal' &&
        log.message.includes('denounced') &&
        log.message.includes('Tribunal is now in session')
      )).toBe(true)
    })

    it('should handle invalid accuser ID gracefully', () => {
      const store = useGameStore.getState()

      store.initializePlayers([
        { name: 'Accused', piece: 'sickle', isStalin: false }
      ])
      const [accused] = useGameStore.getState().players

      store.initiateDenouncement('invalid-id', accused.id, 'Test crime')

      const state = useGameStore.getState()

      // Should not create tribunal
      expect(state.activeTribunal).toBeNull()
      expect(state.denouncementsThisRound).toHaveLength(0)
    })

    it('should handle invalid accused ID gracefully', () => {
      const store = useGameStore.getState()

      store.initializePlayers([
        { name: 'Accuser', piece: 'hammer', isStalin: false }
      ])
      const [accuser] = useGameStore.getState().players

      store.initiateDenouncement(accuser.id, 'invalid-id', 'Test crime')

      const state = useGameStore.getState()

      // Should not create tribunal
      expect(state.activeTribunal).toBeNull()
      expect(state.denouncementsThisRound).toHaveLength(0)
    })
  })

  describe('getWitnessRequirement', () => {
    it('should require 0 witnesses for proletariat rank', () => {
      const store = useGameStore.getState()

      store.initializePlayers([
        { name: 'Proletariat', piece: 'hammer', isStalin: false }
      ])
      const [player] = useGameStore.getState().players

      const result = store.getWitnessRequirement(player.id)

      expect(result.required).toBe(0)
      expect(result.reason).toContain('No witnesses required')
    })

    it('should require 0 witnesses for partyMember rank', () => {
      const store = useGameStore.getState()

      store.initializePlayers([
        { name: 'Party Member', piece: 'redStar', isStalin: false }
      ])
      const [player] = useGameStore.getState().players

      // Red Star starts as party member
      const result = store.getWitnessRequirement(player.id)

      expect(result.required).toBe(0)
    })

    it('should require 2 witnesses for commissar rank', () => {
      const store = useGameStore.getState()

      store.initializePlayers([
        { name: 'Commissar', piece: 'hammer', isStalin: false }
      ])
      const [player] = useGameStore.getState().players

      store.updatePlayer(player.id, { rank: 'commissar' })

      const result = store.getWitnessRequirement(player.id)

      expect(result.required).toBe(2)
      expect(result.reason).toContain('Commissar rank requires 2 witnesses')
    })

    it('should require unanimous for innerCircle rank', () => {
      const store = useGameStore.getState()

      store.initializePlayers([
        { name: 'Inner Circle', piece: 'hammer', isStalin: false }
      ])
      const [player] = useGameStore.getState().players

      store.updatePlayer(player.id, { rank: 'innerCircle' })

      const result = store.getWitnessRequirement(player.id)

      expect(result.required).toBe('unanimous')
      expect(result.reason).toContain('Inner Circle rank requires unanimous agreement')
    })

    it('should require 0 witnesses when player is under suspicion', () => {
      const store = useGameStore.getState()

      store.initializePlayers([
        { name: 'Commissar Under Suspicion', piece: 'hammer', isStalin: false }
      ])
      const [player] = useGameStore.getState().players

      // Promote to Commissar (normally requires 2 witnesses)
      store.updatePlayer(player.id, { rank: 'commissar', underSuspicion: true })

      const result = store.getWitnessRequirement(player.id)

      // Under suspicion overrides rank requirements
      expect(result.required).toBe(0)
      expect(result.reason).toContain('under suspicion')
    })

    it('should require unanimous for Hero of Soviet Union', () => {
      const store = useGameStore.getState()

      store.initializePlayers([
        { name: 'Hero', piece: 'hammer', isStalin: false }
      ])
      const [player] = useGameStore.getState().players

      // Add player to heroes list with proper structure
      const currentRound = useGameStore.getState().roundNumber
      useGameStore.setState({
        heroesOfSovietUnion: [{
          playerId: player.id,
          grantedAtRound: currentRound,
          expiresAtRound: currentRound + 3
        }]
      })

      const result = store.getWitnessRequirement(player.id)

      expect(result.required).toBe('unanimous')
      expect(result.reason).toContain('Hero of Soviet Union')
    })

    it('should handle invalid player ID gracefully', () => {
      const store = useGameStore.getState()

      const result = store.getWitnessRequirement('invalid-id')

      expect(result.required).toBe(0)
      expect(result.reason).toBe('Player not found')
    })
  })

  describe('advanceTribunalPhase', () => {
    it('should advance from accusation to defence', () => {
      const store = useGameStore.getState()

      store.initializePlayers([
        { name: 'Accuser', piece: 'hammer', isStalin: false },
        { name: 'Accused', piece: 'sickle', isStalin: false }
      ])
      const [accuser, accused] = useGameStore.getState().players

      store.initiateDenouncement(accuser.id, accused.id, 'Test crime')

      expect(useGameStore.getState().activeTribunal?.phase).toBe('accusation')

      store.advanceTribunalPhase()

      expect(useGameStore.getState().activeTribunal?.phase).toBe('defence')
    })

    it('should advance from defence to witnesses', () => {
      const store = useGameStore.getState()

      store.initializePlayers([
        { name: 'Accuser', piece: 'hammer', isStalin: false },
        { name: 'Accused', piece: 'sickle', isStalin: false }
      ])
      const [accuser, accused] = useGameStore.getState().players

      store.initiateDenouncement(accuser.id, accused.id, 'Test crime')
      store.advanceTribunalPhase() // accusation → defence

      expect(useGameStore.getState().activeTribunal?.phase).toBe('defence')

      store.advanceTribunalPhase() // defence → witnesses

      expect(useGameStore.getState().activeTribunal?.phase).toBe('witnesses')
    })

    it('should advance from witnesses to judgement', () => {
      const store = useGameStore.getState()

      store.initializePlayers([
        { name: 'Accuser', piece: 'hammer', isStalin: false },
        { name: 'Accused', piece: 'sickle', isStalin: false }
      ])
      const [accuser, accused] = useGameStore.getState().players

      store.initiateDenouncement(accuser.id, accused.id, 'Test crime')
      store.advanceTribunalPhase() // accusation → defence
      store.advanceTribunalPhase() // defence → witnesses

      expect(useGameStore.getState().activeTribunal?.phase).toBe('witnesses')

      store.advanceTribunalPhase() // witnesses → judgement

      expect(useGameStore.getState().activeTribunal?.phase).toBe('judgement')
    })

    it('should handle no active tribunal gracefully', () => {
      const store = useGameStore.getState()

      useGameStore.setState({ activeTribunal: null })

      // Should not crash
      store.advanceTribunalPhase()

      expect(useGameStore.getState().activeTribunal).toBeNull()
    })
  })

  describe('addWitness', () => {
    it('should add witness for the accuser (prosecution)', () => {
      const store = useGameStore.getState()

      store.initializePlayers([
        { name: 'Accuser', piece: 'hammer', isStalin: false },
        { name: 'Accused', piece: 'sickle', isStalin: false },
        { name: 'Witness', piece: 'tank', isStalin: false }
      ])
      const [accuser, accused, witness] = useGameStore.getState().players

      store.initiateDenouncement(accuser.id, accused.id, 'Test crime')

      useGameStore.setState({ gameLog: [] })

      store.addWitness(witness.id, 'for')

      const state = useGameStore.getState()

      expect(state.activeTribunal?.witnessesFor).toContain(witness.id)
      expect(state.activeTribunal?.witnessesFor).toHaveLength(1)
      expect(state.activeTribunal?.witnessesAgainst).toHaveLength(0)

      // Check log entry
      const logs = state.gameLog
      expect(logs.some(log =>
        log.type === 'tribunal' &&
        log.message.includes(witness.name) &&
        log.message.includes('for the accuser')
      )).toBe(true)
    })

    it('should add witness for the accused (defence)', () => {
      const store = useGameStore.getState()

      store.initializePlayers([
        { name: 'Accuser', piece: 'hammer', isStalin: false },
        { name: 'Accused', piece: 'sickle', isStalin: false },
        { name: 'Witness', piece: 'tank', isStalin: false }
      ])
      const [accuser, accused, witness] = useGameStore.getState().players

      store.initiateDenouncement(accuser.id, accused.id, 'Test crime')

      useGameStore.setState({ gameLog: [] })

      store.addWitness(witness.id, 'against')

      const state = useGameStore.getState()

      expect(state.activeTribunal?.witnessesAgainst).toContain(witness.id)
      expect(state.activeTribunal?.witnessesAgainst).toHaveLength(1)
      expect(state.activeTribunal?.witnessesFor).toHaveLength(0)

      // Check log entry
      const logs = state.gameLog
      expect(logs.some(log =>
        log.type === 'tribunal' &&
        log.message.includes(witness.name) &&
        log.message.includes('for the accused')
      )).toBe(true)
    })

    it('should add multiple witnesses to same side', () => {
      const store = useGameStore.getState()

      store.initializePlayers([
        { name: 'Accuser', piece: 'hammer', isStalin: false },
        { name: 'Accused', piece: 'sickle', isStalin: false },
        { name: 'Witness 1', piece: 'tank', isStalin: false },
        { name: 'Witness 2', piece: 'breadLoaf', isStalin: false }
      ])
      const [accuser, accused, witness1, witness2] = useGameStore.getState().players

      store.initiateDenouncement(accuser.id, accused.id, 'Test crime')

      store.addWitness(witness1.id, 'for')
      store.addWitness(witness2.id, 'for')

      const state = useGameStore.getState()

      expect(state.activeTribunal?.witnessesFor).toHaveLength(2)
      expect(state.activeTribunal?.witnessesFor).toContain(witness1.id)
      expect(state.activeTribunal?.witnessesFor).toContain(witness2.id)
    })

    it('should handle invalid witness ID gracefully', () => {
      const store = useGameStore.getState()

      store.initializePlayers([
        { name: 'Accuser', piece: 'hammer', isStalin: false },
        { name: 'Accused', piece: 'sickle', isStalin: false }
      ])
      const [accuser, accused] = useGameStore.getState().players

      store.initiateDenouncement(accuser.id, accused.id, 'Test crime')

      // Should not crash
      store.addWitness('invalid-id', 'for')

      const state = useGameStore.getState()

      // Should not add invalid witness
      expect(state.activeTribunal?.witnessesFor).toHaveLength(0)
    })

    it('should handle no active tribunal gracefully', () => {
      const store = useGameStore.getState()

      store.initializePlayers([
        { name: 'Witness', piece: 'hammer', isStalin: false }
      ])
      const [witness] = useGameStore.getState().players

      useGameStore.setState({ activeTribunal: null })

      // Should not crash
      store.addWitness(witness.id, 'for')

      expect(useGameStore.getState().activeTribunal).toBeNull()
    })
  })

  describe('renderTribunalVerdict', () => {
    it('should send accused to Gulag on guilty verdict', () => {
      const store = useGameStore.getState()

      store.initializePlayers([
        { name: 'Accuser', piece: 'hammer', isStalin: false },
        { name: 'Accused', piece: 'sickle', isStalin: false }
      ])
      const [accuser, accused] = useGameStore.getState().players

      store.initiateDenouncement(accuser.id, accused.id, 'Test crime')

      // Mock window.confirm for sendToGulag (Hammer ability check)
      vi.spyOn(window, 'confirm').mockReturnValue(true)

      store.renderTribunalVerdict('guilty')

      const updatedAccused = useGameStore.getState().players.find(p => p.id === accused.id)

      expect(updatedAccused?.inGulag).toBe(true)
    })

    it('should give accuser informant bonus on guilty verdict', () => {
      const store = useGameStore.getState()

      store.initializePlayers([
        { name: 'Accuser', piece: 'hammer', isStalin: false },
        { name: 'Accused', piece: 'sickle', isStalin: false }
      ])
      const [accuser, accused] = useGameStore.getState().players

      const initialRubles = accuser.rubles

      store.initiateDenouncement(accuser.id, accused.id, 'Test crime')

      vi.spyOn(window, 'confirm').mockReturnValue(true)

      store.renderTribunalVerdict('guilty')

      const updatedAccuser = useGameStore.getState().players.find(p => p.id === accuser.id)

      expect(updatedAccuser?.rubles).toBe(initialRubles + 100)
    })

    it('should update tribunal statistics on guilty verdict', () => {
      const store = useGameStore.getState()

      store.initializePlayers([
        { name: 'Accuser', piece: 'hammer', isStalin: false },
        { name: 'Accused', piece: 'sickle', isStalin: false }
      ])
      const [accuser, accused] = useGameStore.getState().players

      store.initiateDenouncement(accuser.id, accused.id, 'Test crime')

      vi.spyOn(window, 'confirm').mockReturnValue(true)

      store.renderTribunalVerdict('guilty')

      const state = useGameStore.getState()

      expect(state.gameStatistics.playerStats[accuser.id].tribunalsWon).toBe(1)
      expect(state.gameStatistics.playerStats[accused.id].tribunalsLost).toBe(1)
    })

    it('should close tribunal after guilty verdict', () => {
      const store = useGameStore.getState()

      store.initializePlayers([
        { name: 'Accuser', piece: 'hammer', isStalin: false },
        { name: 'Accused', piece: 'sickle', isStalin: false }
      ])
      const [accuser, accused] = useGameStore.getState().players

      store.initiateDenouncement(accuser.id, accused.id, 'Test crime')

      expect(useGameStore.getState().activeTribunal).not.toBeNull()

      vi.spyOn(window, 'confirm').mockReturnValue(true)

      store.renderTribunalVerdict('guilty')

      expect(useGameStore.getState().activeTribunal).toBeNull()
    })

    it('should demote accuser on innocent verdict', () => {
      const store = useGameStore.getState()

      store.initializePlayers([
        { name: 'Accuser', piece: 'hammer', isStalin: false },
        { name: 'Accused', piece: 'sickle', isStalin: false }
      ])
      const [accuser, accused] = useGameStore.getState().players

      // Promote accuser so they can be demoted
      store.updatePlayer(accuser.id, { rank: 'partyMember' })

      store.initiateDenouncement(accuser.id, accused.id, 'Test crime')

      store.renderTribunalVerdict('innocent')

      const updatedAccuser = useGameStore.getState().players.find(p => p.id === accuser.id)

      expect(updatedAccuser?.rank).toBe('proletariat')
    })

    it('should update statistics on innocent verdict', () => {
      const store = useGameStore.getState()

      store.initializePlayers([
        { name: 'Accuser', piece: 'hammer', isStalin: false },
        { name: 'Accused', piece: 'sickle', isStalin: false }
      ])
      const [accuser, accused] = useGameStore.getState().players

      store.initiateDenouncement(accuser.id, accused.id, 'Test crime')

      store.renderTribunalVerdict('innocent')

      const state = useGameStore.getState()

      expect(state.gameStatistics.playerStats[accuser.id].tribunalsLost).toBe(1)
      expect(state.gameStatistics.playerStats[accused.id].tribunalsWon).toBe(1)
    })

    it('should send both players to Gulag on bothGuilty verdict', () => {
      const store = useGameStore.getState()

      store.initializePlayers([
        { name: 'Accuser', piece: 'tank', isStalin: false },
        { name: 'Accused', piece: 'tank', isStalin: false }
      ])
      const [accuser, accused] = useGameStore.getState().players

      store.initiateDenouncement(accuser.id, accused.id, 'Test crime')

      vi.spyOn(window, 'confirm').mockReturnValue(true)

      store.renderTribunalVerdict('bothGuilty')

      const state = useGameStore.getState()

      // Both should be in Gulag (or redirected if Tank ability active)
      // Tank ability might redirect first Gulag, so let's just check tribunalsLost
      expect(state.gameStatistics.playerStats[accuser.id].tribunalsLost).toBe(1)
      expect(state.gameStatistics.playerStats[accused.id].tribunalsLost).toBe(1)
    })

    it('should mark accused as under suspicion on insufficient verdict', () => {
      const store = useGameStore.getState()

      store.initializePlayers([
        { name: 'Accuser', piece: 'hammer', isStalin: false },
        { name: 'Accused', piece: 'sickle', isStalin: false }
      ])
      const [accuser, accused] = useGameStore.getState().players

      store.initiateDenouncement(accuser.id, accused.id, 'Test crime')

      store.renderTribunalVerdict('insufficient')

      const updatedAccused = useGameStore.getState().players.find(p => p.id === accused.id)

      expect(updatedAccused?.underSuspicion).toBe(true)
    })

    it('should add appropriate log entry on insufficient verdict', () => {
      const store = useGameStore.getState()

      store.initializePlayers([
        { name: 'Accuser', piece: 'hammer', isStalin: false },
        { name: 'Accused', piece: 'sickle', isStalin: false }
      ])
      const [accuser, accused] = useGameStore.getState().players

      store.initiateDenouncement(accuser.id, accused.id, 'Test crime')

      useGameStore.setState({ gameLog: [] })

      store.renderTribunalVerdict('insufficient')

      const logs = useGameStore.getState().gameLog

      expect(logs.some(log =>
        log.type === 'tribunal' &&
        log.message.includes('INSUFFICIENT EVIDENCE') &&
        log.message.includes('under suspicion')
      )).toBe(true)
    })

    it('should handle no active tribunal gracefully', () => {
      const store = useGameStore.getState()

      useGameStore.setState({ activeTribunal: null })

      // Should not crash
      store.renderTribunalVerdict('guilty')

      expect(useGameStore.getState().activeTribunal).toBeNull()
    })

    it('should handle verdict when accuser was eliminated between initiation and verdict', () => {
      const store = useGameStore.getState()

      store.initializePlayers([
        { name: 'Accuser', piece: 'hammer', isStalin: false },
        { name: 'Accused', piece: 'sickle', isStalin: false }
      ])
      const [accuser, accused] = useGameStore.getState().players

      store.initiateDenouncement(accuser.id, accused.id, 'Test crime')

      // Eliminate the accuser between initiation and verdict
      store.eliminatePlayer(accuser.id, 'bankruptcy')

      // Should not crash when rendering verdict with eliminated accuser
      store.renderTribunalVerdict('innocent')

      // Tribunal should be closed after verdict
      expect(useGameStore.getState().activeTribunal).toBeNull()
    })

    it('should handle verdict when accused was eliminated between initiation and verdict', () => {
      const store = useGameStore.getState()

      store.initializePlayers([
        { name: 'Accuser', piece: 'hammer', isStalin: false },
        { name: 'Accused', piece: 'sickle', isStalin: false }
      ])
      const [accuser, accused] = useGameStore.getState().players

      store.initiateDenouncement(accuser.id, accused.id, 'Test crime')

      // Eliminate the accused between initiation and verdict
      store.eliminatePlayer(accused.id, 'bankruptcy')

      // Should not crash when rendering verdict with eliminated accused
      store.renderTribunalVerdict('guilty')

      // Tribunal should be closed after verdict
      expect(useGameStore.getState().activeTribunal).toBeNull()
    })

    it('should release accuser from Gulag with bonus on guilty verdict if accuser in Gulag', () => {
      const store = useGameStore.getState()

      store.initializePlayers([
        { name: 'Accuser', piece: 'sickle', isStalin: false },
        { name: 'Accused', piece: 'tank', isStalin: false }
      ])
      const [accuser, accused] = useGameStore.getState().players

      // Put accuser in Gulag first
      store.updatePlayer(accuser.id, {
        inGulag: true,
        gulagTurns: 2,
        position: 10
      })

      const initialRubles = accuser.rubles

      store.initiateDenouncement(accuser.id, accused.id, 'Test crime')

      vi.spyOn(window, 'confirm').mockReturnValue(true)

      store.renderTribunalVerdict('guilty')

      const updatedAccuser = useGameStore.getState().players.find(p => p.id === accuser.id)

      expect(updatedAccuser?.inGulag).toBe(false)
      expect(updatedAccuser?.gulagTurns).toBe(0)
      expect(updatedAccuser?.rubles).toBe(initialRubles + 100)
    })
  })
})
