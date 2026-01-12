// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../../store/gameStore'

describe('gameStore - Piece Abilities', () => {
  beforeEach(() => {
    const store = useGameStore.getState()
    store.resetGame()
  })

  describe('sickleHarvest', () => {
    it('should harvest a collective farm property successfully', () => {
      const { initializePlayers, setPropertyCustodian, sickleHarvest } = useGameStore.getState()

      initializePlayers([
        { name: 'Sickle Player', piece: 'sickle', isStalin: false },
        { name: 'Victim Player', piece: 'tank', isStalin: false }
      ])

      const state = useGameStore.getState()
      const sicklePlayerId = state.players[0].id
      const victimPlayerId = state.players[1].id

      // Set up property - Mediterranean Avenue (space 1, cost ₽60)
      setPropertyCustodian(1, victimPlayerId)

      // Execute harvest
      sickleHarvest(sicklePlayerId, 1)

      // Verify property transferred
      const updatedState = useGameStore.getState()
      const property = updatedState.properties.find(p => p.spaceId === 1)
      expect(property?.custodianId).toBe(sicklePlayerId)

      // Verify ability marked as used
      const updatedSicklePlayer = updatedState.players.find(p => p.id === sicklePlayerId)
      expect(updatedSicklePlayer?.hasUsedSickleHarvest).toBe(true)

      // Verify log entry
      const harvestLog = updatedState.gameLog.find(log =>
        log.message.includes('Sickle harvested') && log.type === 'property'
      )
      expect(harvestLog).toBeDefined()
      expect(harvestLog?.message).toContain('Camp Vorkuta')
      expect(harvestLog?.message).toContain('Victim Player')
    })

    it('should harvest from the State (no custodian)', () => {
      const { initializePlayers, setPropertyCustodian, sickleHarvest } = useGameStore.getState()

      initializePlayers([
        { name: 'Sickle Player', piece: 'sickle', isStalin: false }
      ])

      const state = useGameStore.getState()
      const sicklePlayerId = state.players[0].id

      // Property with no custodian (State-owned)
      setPropertyCustodian(1, null)

      sickleHarvest(sicklePlayerId, 1)

      const updatedState = useGameStore.getState()
      const property = updatedState.properties.find(p => p.spaceId === 1)
      expect(property?.custodianId).toBe(sicklePlayerId)

      const harvestLog = updatedState.gameLog.find(log =>
        log.message.includes('harvested') && log.message.includes('the State')
      )
      expect(harvestLog).toBeDefined()
    })

    it('should not harvest property worth ₽150 or more', () => {
      const { initializePlayers, setPropertyCustodian, sickleHarvest } = useGameStore.getState()

      initializePlayers([
        { name: 'Sickle Player', piece: 'sickle', isStalin: false },
        { name: 'Victim Player', piece: 'tank', isStalin: false }
      ])

      const state = useGameStore.getState()
      const sicklePlayerId = state.players[0].id
      const victimPlayerId = state.players[1].id

      // Set up property - Park Place (space 37, cost ₽350)
      setPropertyCustodian(37, victimPlayerId)

      sickleHarvest(sicklePlayerId, 37)

      // Verify property NOT transferred
      const updatedState = useGameStore.getState()
      const property = updatedState.properties.find(p => p.spaceId === 37)
      expect(property?.custodianId).toBe(victimPlayerId)

      // Verify ability NOT marked as used
      const updatedSicklePlayer = updatedState.players.find(p => p.id === sicklePlayerId)
      expect(updatedSicklePlayer?.hasUsedSickleHarvest).toBe(false)

      // Verify error log entry
      const errorLog = updatedState.gameLog.find(log =>
        log.message.includes('Cannot harvest') && log.message.includes('₽150')
      )
      expect(errorLog).toBeDefined()
    })

    it('should not work if player is not sickle piece', () => {
      const { initializePlayers, setPropertyCustodian, sickleHarvest } = useGameStore.getState()

      initializePlayers([
        { name: 'Wrong Player', piece: 'tank', isStalin: false }
      ])

      const state = useGameStore.getState()
      const wrongPlayerId = state.players[0].id

      setPropertyCustodian(1, null)

      sickleHarvest(wrongPlayerId, 1)

      // Verify property NOT transferred
      const updatedState = useGameStore.getState()
      const property = updatedState.properties.find(p => p.spaceId === 1)
      expect(property?.custodianId).toBeNull()
    })

    it('should not work if ability already used', () => {
      const { initializePlayers, setPropertyCustodian, sickleHarvest, updatePlayer } = useGameStore.getState()

      initializePlayers([
        { name: 'Sickle Player', piece: 'sickle', isStalin: false }
      ])

      const state = useGameStore.getState()
      const sicklePlayerId = state.players[0].id

      // Mark ability as already used
      updatePlayer(sicklePlayerId, { hasUsedSickleHarvest: true })

      setPropertyCustodian(1, null)

      const initialLogLength = useGameStore.getState().gameLog.length

      sickleHarvest(sicklePlayerId, 1)

      // Verify property NOT transferred
      const updatedState = useGameStore.getState()
      const property = updatedState.properties.find(p => p.spaceId === 1)
      expect(property?.custodianId).toBeNull()

      // Verify no new log entries
      expect(updatedState.gameLog.length).toBe(initialLogLength)
    })

    it('should not work if player does not exist', () => {
      const { setPropertyCustodian, sickleHarvest } = useGameStore.getState()

      setPropertyCustodian(1, null)

      const initialLogLength = useGameStore.getState().gameLog.length

      sickleHarvest('nonexistent-player', 1)

      // Verify no changes
      const updatedState = useGameStore.getState()
      const property = updatedState.properties.find(p => p.spaceId === 1)
      expect(property?.custodianId).toBeUndefined()
      expect(updatedState.gameLog.length).toBe(initialLogLength)
    })

    it('should not work if property does not exist', () => {
      const { initializePlayers, sickleHarvest } = useGameStore.getState()

      initializePlayers([
        { name: 'Sickle Player', piece: 'sickle', isStalin: false }
      ])

      const state = useGameStore.getState()
      const sicklePlayerId = state.players[0].id

      const initialLogLength = useGameStore.getState().gameLog.length

      sickleHarvest(sicklePlayerId, 999)  // Non-existent property

      // Verify no changes
      const updatedState = useGameStore.getState()
      expect(updatedState.gameLog.length).toBe(initialLogLength)
      const player = updatedState.players.find(p => p.id === sicklePlayerId)
      expect(player?.hasUsedSickleHarvest).toBe(false)
    })
  })

  describe('ironCurtainDisappear', () => {
    it('should make property disappear (return to State)', () => {
      const { initializePlayers, setPropertyCustodian, ironCurtainDisappear } = useGameStore.getState()

      initializePlayers([
        { name: 'Iron Player', piece: 'ironCurtain', isStalin: false },
        { name: 'Victim Player', piece: 'tank', isStalin: false }
      ])

      const state = useGameStore.getState()
      const ironCurtainPlayerId = state.players[0].id
      const victimPlayerId = state.players[1].id

      // Set up property owned by victim
      setPropertyCustodian(1, victimPlayerId)

      // Execute iron curtain disappear
      ironCurtainDisappear(ironCurtainPlayerId, 1)

      // Verify property returned to State (null custodian)
      const updatedState = useGameStore.getState()
      const property = updatedState.properties.find(p => p.spaceId === 1)
      expect(property?.custodianId).toBeNull()

      // Verify ability marked as used
      const updatedPlayer = updatedState.players.find(p => p.id === ironCurtainPlayerId)
      expect(updatedPlayer?.hasUsedIronCurtainDisappear).toBe(true)

      // Verify log entry
      const disappearLog = updatedState.gameLog.find(log =>
        log.message.includes('Iron Curtain made') && log.message.includes('disappear')
      )
      expect(disappearLog).toBeDefined()
      expect(disappearLog?.message).toContain('Camp Vorkuta')
      expect(disappearLog?.message).toContain('Victim Player')
    })

    it('should work on State-owned property', () => {
      const { initializePlayers, setPropertyCustodian, ironCurtainDisappear } = useGameStore.getState()

      initializePlayers([
        { name: 'Iron Player', piece: 'ironCurtain', isStalin: false }
      ])

      const state = useGameStore.getState()
      const ironCurtainPlayerId = state.players[0].id

      // Property already owned by State
      setPropertyCustodian(1, null)

      ironCurtainDisappear(ironCurtainPlayerId, 1)

      // Verify property still with State
      const updatedState = useGameStore.getState()
      const property = updatedState.properties.find(p => p.spaceId === 1)
      expect(property?.custodianId).toBeNull()

      // Verify ability marked as used
      const updatedPlayer = updatedState.players.find(p => p.id === ironCurtainPlayerId)
      expect(updatedPlayer?.hasUsedIronCurtainDisappear).toBe(true)

      // Verify log mentions "the State"
      const disappearLog = updatedState.gameLog.find(log =>
        log.message.includes('disappear') && log.message.includes('the State')
      )
      expect(disappearLog).toBeDefined()
    })

    it('should not work if player is not ironCurtain piece', () => {
      const { initializePlayers, setPropertyCustodian, ironCurtainDisappear } = useGameStore.getState()

      initializePlayers([
        { name: 'Wrong Player', piece: 'tank', isStalin: false }
      ])

      const state = useGameStore.getState()
      const wrongPlayerId = state.players[0].id

      setPropertyCustodian(1, wrongPlayerId)

      ironCurtainDisappear(wrongPlayerId, 1)

      // Verify property NOT changed
      const updatedState = useGameStore.getState()
      const property = updatedState.properties.find(p => p.spaceId === 1)
      expect(property?.custodianId).toBe(wrongPlayerId)
    })

    it('should not work if ability already used', () => {
      const { initializePlayers, setPropertyCustodian, ironCurtainDisappear, updatePlayer } = useGameStore.getState()

      initializePlayers([
        { name: 'Iron Player', piece: 'ironCurtain', isStalin: false },
        { name: 'Victim Player', piece: 'tank', isStalin: false }
      ])

      const state = useGameStore.getState()
      const ironCurtainPlayerId = state.players[0].id
      const victimPlayerId = state.players[1].id

      // Mark ability as already used
      updatePlayer(ironCurtainPlayerId, { hasUsedIronCurtainDisappear: true })

      setPropertyCustodian(1, victimPlayerId)

      const initialLogLength = useGameStore.getState().gameLog.length

      ironCurtainDisappear(ironCurtainPlayerId, 1)

      // Verify property NOT changed
      const updatedState = useGameStore.getState()
      const property = updatedState.properties.find(p => p.spaceId === 1)
      expect(property?.custodianId).toBe(victimPlayerId)

      // Verify no new log entries
      expect(updatedState.gameLog.length).toBe(initialLogLength)
    })

    it('should not work if player does not exist', () => {
      const { setPropertyCustodian, ironCurtainDisappear } = useGameStore.getState()

      setPropertyCustodian(1, null)

      const initialLogLength = useGameStore.getState().gameLog.length

      ironCurtainDisappear('nonexistent-player', 1)

      const updatedState = useGameStore.getState()
      expect(updatedState.gameLog.length).toBe(initialLogLength)
    })

    it('should not work if property does not exist', () => {
      const { initializePlayers, ironCurtainDisappear } = useGameStore.getState()

      initializePlayers([
        { name: 'Iron Player', piece: 'ironCurtain', isStalin: false }
      ])

      const state = useGameStore.getState()
      const ironCurtainPlayerId = state.players[0].id

      const initialLogLength = useGameStore.getState().gameLog.length

      ironCurtainDisappear(ironCurtainPlayerId, 999)

      const updatedState = useGameStore.getState()
      expect(updatedState.gameLog.length).toBe(initialLogLength)
      const player = updatedState.players.find(p => p.id === ironCurtainPlayerId)
      expect(player?.hasUsedIronCurtainDisappear).toBe(false)
    })
  })

  describe('leninSpeech', () => {
    it('should collect ₽100 from each applauder', () => {
      const { initializePlayers, leninSpeech } = useGameStore.getState()

      initializePlayers([
        { name: 'Lenin Player', piece: 'statueOfLenin', isStalin: false },
        { name: 'Applauder 1', piece: 'tank', isStalin: false },
        { name: 'Applauder 2', piece: 'sickle', isStalin: false }
      ])

      const state = useGameStore.getState()
      const leninPlayerId = state.players[0].id
      const applauder1Id = state.players[1].id
      const applauder2Id = state.players[2].id

      const initialLeninRubles = state.players[0].rubles

      // Execute speech with 2 applauders
      leninSpeech(leninPlayerId, [applauder1Id, applauder2Id])

      // Verify lenin collected ₽200 total (₽100 x 2)
      const updatedState = useGameStore.getState()
      const updatedLenin = updatedState.players.find(p => p.id === leninPlayerId)
      expect(updatedLenin?.rubles).toBe(initialLeninRubles + 200)

      // Verify applauders lost ₽100 each
      const updatedApp1 = updatedState.players.find(p => p.id === applauder1Id)
      const updatedApp2 = updatedState.players.find(p => p.id === applauder2Id)
      expect(updatedApp1?.rubles).toBe(1500 - 100)
      expect(updatedApp2?.rubles).toBe(1500 - 100)

      // Verify ability marked as used
      expect(updatedLenin?.hasUsedLeninSpeech).toBe(true)

      // Verify log entry
      const speechLog = updatedState.gameLog.find(log =>
        log.message.includes('inspiring speech') && log.type === 'payment'
      )
      expect(speechLog).toBeDefined()
      expect(speechLog?.message).toContain('₽200')
      expect(speechLog?.message).toContain('2 applauders')
    })

    it('should collect partial amount if applauder has less than ₽100', () => {
      const { initializePlayers, updatePlayer, leninSpeech } = useGameStore.getState()

      initializePlayers([
        { name: 'Lenin Player', piece: 'statueOfLenin', isStalin: false },
        { name: 'Poor Applauder', piece: 'tank', isStalin: false }
      ])

      const state = useGameStore.getState()
      const leninPlayerId = state.players[0].id
      const poorApplauderId = state.players[1].id

      // Set poor applauder to only have ₽50
      updatePlayer(poorApplauderId, { rubles: 50 })

      const initialLeninRubles = useGameStore.getState().players[0].rubles

      leninSpeech(leninPlayerId, [poorApplauderId])

      // Verify lenin collected only ₽50
      const updatedState = useGameStore.getState()
      const updatedLenin = updatedState.players.find(p => p.id === leninPlayerId)
      expect(updatedLenin?.rubles).toBe(initialLeninRubles + 50)

      // Verify poor applauder has ₽0
      const updatedPoor = updatedState.players.find(p => p.id === poorApplauderId)
      expect(updatedPoor?.rubles).toBe(0)

      // Verify log entry shows ₽50
      const speechLog = updatedState.gameLog.find(log =>
        log.message.includes('inspiring speech')
      )
      expect(speechLog?.message).toContain('₽50')
    })

    it('should skip eliminated applauders', () => {
      const { initializePlayers, updatePlayer, leninSpeech } = useGameStore.getState()

      initializePlayers([
        { name: 'Lenin Player', piece: 'statueOfLenin', isStalin: false },
        { name: 'Active Applauder', piece: 'tank', isStalin: false },
        { name: 'Eliminated Applauder', piece: 'sickle', isStalin: false }
      ])

      const state = useGameStore.getState()
      const leninPlayerId = state.players[0].id
      const activeApplauderId = state.players[1].id
      const eliminatedApplauderId = state.players[2].id

      // Mark one applauder as eliminated
      updatePlayer(eliminatedApplauderId, { isEliminated: true })

      const initialLeninRubles = useGameStore.getState().players[0].rubles

      leninSpeech(leninPlayerId, [activeApplauderId, eliminatedApplauderId])

      // Verify lenin collected only ₽100 (from active applauder)
      const updatedState = useGameStore.getState()
      const updatedLenin = updatedState.players.find(p => p.id === leninPlayerId)
      expect(updatedLenin?.rubles).toBe(initialLeninRubles + 100)

      // Verify eliminated applauder kept their rubles
      const updatedEliminated = updatedState.players.find(p => p.id === eliminatedApplauderId)
      expect(updatedEliminated?.rubles).toBe(1500)

      // Verify log entry shows ₽100 from 2 applauders (one was skipped)
      const speechLog = updatedState.gameLog.find(log =>
        log.message.includes('inspiring speech')
      )
      expect(speechLog?.message).toContain('₽100')
      expect(speechLog?.message).toContain('2 applauders')
    })

    it('should work with empty applauders array', () => {
      const { initializePlayers, leninSpeech } = useGameStore.getState()

      initializePlayers([
        { name: 'Lenin Player', piece: 'statueOfLenin', isStalin: false }
      ])

      const state = useGameStore.getState()
      const leninPlayerId = state.players[0].id
      const initialLeninRubles = state.players[0].rubles

      leninSpeech(leninPlayerId, [])

      // Verify lenin collected nothing
      const updatedState = useGameStore.getState()
      const updatedLenin = updatedState.players.find(p => p.id === leninPlayerId)
      expect(updatedLenin?.rubles).toBe(initialLeninRubles)

      // Verify ability marked as used
      expect(updatedLenin?.hasUsedLeninSpeech).toBe(true)

      // Verify log entry shows ₽0
      const speechLog = updatedState.gameLog.find(log =>
        log.message.includes('inspiring speech')
      )
      expect(speechLog?.message).toContain('₽0')
    })

    it('should not work if player is not statueOfLenin piece', () => {
      const { initializePlayers, leninSpeech } = useGameStore.getState()

      initializePlayers([
        { name: 'Wrong Player', piece: 'tank', isStalin: false },
        { name: 'Applauder', piece: 'sickle', isStalin: false }
      ])

      const state = useGameStore.getState()
      const wrongPlayerId = state.players[0].id
      const applauderId = state.players[1].id

      const initialWrongRubles = state.players[0].rubles
      const initialAppRubles = state.players[1].rubles

      leninSpeech(wrongPlayerId, [applauderId])

      // Verify no changes
      const updatedState = useGameStore.getState()
      const updatedWrong = updatedState.players.find(p => p.id === wrongPlayerId)
      const updatedApp = updatedState.players.find(p => p.id === applauderId)
      expect(updatedWrong?.rubles).toBe(initialWrongRubles)
      expect(updatedApp?.rubles).toBe(initialAppRubles)
    })

    it('should not work if ability already used', () => {
      const { initializePlayers, updatePlayer, leninSpeech } = useGameStore.getState()

      initializePlayers([
        { name: 'Lenin Player', piece: 'statueOfLenin', isStalin: false },
        { name: 'Applauder', piece: 'tank', isStalin: false }
      ])

      const state = useGameStore.getState()
      const leninPlayerId = state.players[0].id
      const applauderId = state.players[1].id

      // Mark ability as already used
      updatePlayer(leninPlayerId, { hasUsedLeninSpeech: true })

      const initialState = useGameStore.getState()
      const initialLeninRubles = initialState.players[0].rubles
      const initialAppRubles = initialState.players[1].rubles
      const initialLogLength = initialState.gameLog.length

      leninSpeech(leninPlayerId, [applauderId])

      // Verify no changes
      const updatedState = useGameStore.getState()
      const updatedLenin = updatedState.players.find(p => p.id === leninPlayerId)
      const updatedApp = updatedState.players.find(p => p.id === applauderId)
      expect(updatedLenin?.rubles).toBe(initialLeninRubles)
      expect(updatedApp?.rubles).toBe(initialAppRubles)
      expect(updatedState.gameLog.length).toBe(initialLogLength)
    })

    it('should not work if player does not exist', () => {
      const { initializePlayers, leninSpeech } = useGameStore.getState()

      initializePlayers([
        { name: 'Applauder', piece: 'tank', isStalin: false }
      ])

      const state = useGameStore.getState()
      const applauderId = state.players[0].id

      const initialAppRubles = state.players[0].rubles
      const initialLogLength = state.gameLog.length

      leninSpeech('nonexistent-player', [applauderId])

      // Verify no changes
      const updatedState = useGameStore.getState()
      const updatedApp = updatedState.players.find(p => p.id === applauderId)
      expect(updatedApp?.rubles).toBe(initialAppRubles)
      expect(updatedState.gameLog.length).toBe(initialLogLength)
    })

    it('should handle non-existent applauders gracefully', () => {
      const { initializePlayers, leninSpeech } = useGameStore.getState()

      initializePlayers([
        { name: 'Lenin Player', piece: 'statueOfLenin', isStalin: false },
        { name: 'Applauder', piece: 'tank', isStalin: false }
      ])

      const state = useGameStore.getState()
      const leninPlayerId = state.players[0].id
      const applauderId = state.players[1].id

      const initialLeninRubles = state.players[0].rubles

      // Include non-existent applauder in list
      leninSpeech(leninPlayerId, [applauderId, 'nonexistent-app'])

      // Verify lenin only collected from existing applauder
      const updatedState = useGameStore.getState()
      const updatedLenin = updatedState.players.find(p => p.id === leninPlayerId)
      expect(updatedLenin?.rubles).toBe(initialLeninRubles + 100)

      // Verify ability still marked as used
      expect(updatedLenin?.hasUsedLeninSpeech).toBe(true)
    })
  })

  describe('promotePlayer', () => {
    it('should promote proletariat to partyMember', () => {
      const { initializePlayers, promotePlayer } = useGameStore.getState()

      initializePlayers([
        { name: 'Test Player', piece: 'sickle', isStalin: false }
      ])

      const state = useGameStore.getState()
      const playerId = state.players[0].id

      promotePlayer(playerId)

      const updatedState = useGameStore.getState()
      const updatedPlayer = updatedState.players.find(p => p.id === playerId)
      expect(updatedPlayer?.rank).toBe('partyMember')

      // Verify log entry
      const promoteLog = updatedState.gameLog.find(log =>
        log.message.includes('promoted to partyMember') && log.type === 'rank'
      )
      expect(promoteLog).toBeDefined()
      expect(promoteLog?.message).toContain('Test Player')
    })

    it('should promote partyMember to commissar', () => {
      const { initializePlayers, updatePlayer, promotePlayer } = useGameStore.getState()

      initializePlayers([
        { name: 'Test Player', piece: 'sickle', isStalin: false }
      ])

      const state = useGameStore.getState()
      const playerId = state.players[0].id

      // Set rank to partyMember
      updatePlayer(playerId, { rank: 'partyMember' })

      promotePlayer(playerId)

      const updatedState = useGameStore.getState()
      const updatedPlayer = updatedState.players.find(p => p.id === playerId)
      expect(updatedPlayer?.rank).toBe('commissar')

      const promoteLog = updatedState.gameLog.find(log =>
        log.message.includes('promoted to commissar')
      )
      expect(promoteLog).toBeDefined()
    })

    it('should promote commissar to innerCircle', () => {
      const { initializePlayers, updatePlayer, promotePlayer } = useGameStore.getState()

      initializePlayers([
        { name: 'Test Player', piece: 'sickle', isStalin: false }
      ])

      const state = useGameStore.getState()
      const playerId = state.players[0].id

      // Set rank to commissar
      updatePlayer(playerId, { rank: 'commissar' })

      promotePlayer(playerId)

      const updatedState = useGameStore.getState()
      const updatedPlayer = updatedState.players.find(p => p.id === playerId)
      expect(updatedPlayer?.rank).toBe('innerCircle')

      const promoteLog = updatedState.gameLog.find(log =>
        log.message.includes('promoted to innerCircle')
      )
      expect(promoteLog).toBeDefined()
    })

    it('should not promote player already at innerCircle rank', () => {
      const { initializePlayers, updatePlayer, promotePlayer } = useGameStore.getState()

      initializePlayers([
        { name: 'Test Player', piece: 'sickle', isStalin: false }
      ])

      const state = useGameStore.getState()
      const playerId = state.players[0].id

      // Set rank to innerCircle
      updatePlayer(playerId, { rank: 'innerCircle' })

      promotePlayer(playerId)

      // Verify rank unchanged
      const updatedState = useGameStore.getState()
      const updatedPlayer = updatedState.players.find(p => p.id === playerId)
      expect(updatedPlayer?.rank).toBe('innerCircle')

      // Verify log entry mentions already at highest rank
      const alreadyMaxLog = updatedState.gameLog.find(log =>
        log.message.includes('already at the highest rank') && log.type === 'system'
      )
      expect(alreadyMaxLog).toBeDefined()
      expect(alreadyMaxLog?.message).toContain('Inner Circle')
    })

    it('should not promote if player does not exist', () => {
      const { promotePlayer } = useGameStore.getState()

      const initialLogLength = useGameStore.getState().gameLog.length

      promotePlayer('nonexistent-player')

      // Verify no log entries added
      const updatedState = useGameStore.getState()
      expect(updatedState.gameLog.length).toBe(initialLogLength)
    })

    it('should handle multiple promotions correctly', () => {
      const { initializePlayers, promotePlayer } = useGameStore.getState()

      initializePlayers([
        { name: 'Test Player', piece: 'sickle', isStalin: false }
      ])

      const state = useGameStore.getState()
      const playerId = state.players[0].id

      // Promote multiple times
      promotePlayer(playerId)  // proletariat -> partyMember
      promotePlayer(playerId)  // partyMember -> commissar
      promotePlayer(playerId)  // commissar -> innerCircle

      const updatedState = useGameStore.getState()
      const updatedPlayer = updatedState.players.find(p => p.id === playerId)
      expect(updatedPlayer?.rank).toBe('innerCircle')

      // Verify we have 3 promotion log entries
      const promoteLogs = updatedState.gameLog.filter(log => log.type === 'rank')
      expect(promoteLogs.length).toBe(3)
    })
  })
})
