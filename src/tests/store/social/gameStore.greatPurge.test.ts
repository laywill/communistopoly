// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../../../store/gameStore'

describe('gameStore - Great Purge', () => {
  const setupPlayers = () => {
    const { initializePlayers } = useGameStore.getState()
    initializePlayers([
      { name: 'Player 1', piece: 'sickle', isStalin: false },
      { name: 'Player 2', piece: 'redStar', isStalin: false },
      { name: 'Player 3', piece: 'breadLoaf', isStalin: false },
      { name: 'Player 4', piece: 'ironCurtain', isStalin: false }
    ])
  }

  beforeEach(() => {
    useGameStore.getState().resetGame()
    setupPlayers()
  })

  describe('initiateGreatPurge()', () => {
    it('should initiate Great Purge with correct state', () => {
      const { initiateGreatPurge } = useGameStore.getState()

      initiateGreatPurge()

      const state = useGameStore.getState()
      expect(state.greatPurgeUsed).toBe(true)
      expect(state.activeGreatPurge).not.toBeNull()
      expect(state.activeGreatPurge?.isActive).toBe(true)
      expect(state.activeGreatPurge?.votes).toEqual({})
      expect(state.activeGreatPurge?.timestamp).toBeInstanceOf(Date)
    })

    it('should add log entry when Great Purge is initiated', () => {
      const { initiateGreatPurge } = useGameStore.getState()
      const initialLogLength = useGameStore.getState().gameLog.length

      initiateGreatPurge()

      const logs = useGameStore.getState().gameLog
      expect(logs.length).toBe(initialLogLength + 1)
      expect(logs[logs.length - 1].type).toBe('system')
      expect(logs[logs.length - 1].message).toContain('THE GREAT PURGE HAS BEGUN')
    })

    it('should not allow Great Purge to be used twice in one game', () => {
      const { initiateGreatPurge } = useGameStore.getState()

      // First use
      initiateGreatPurge()
      const firstState = useGameStore.getState()
      expect(firstState.activeGreatPurge).not.toBeNull()

      // Resolve the first Great Purge
      useGameStore.getState().resolveGreatPurge()

      // Try to use it again
      const initialLogLength = useGameStore.getState().gameLog.length
      initiateGreatPurge()

      const secondState = useGameStore.getState()
      expect(secondState.activeGreatPurge).toBeNull()
      expect(secondState.greatPurgeUsed).toBe(true)

      // Should add error log
      const logs = useGameStore.getState().gameLog
      expect(logs.length).toBe(initialLogLength + 1)
      expect(logs[logs.length - 1].message).toContain('already been used')
    })

    it('should set greatPurgeUsed flag to true', () => {
      const { initiateGreatPurge } = useGameStore.getState()

      expect(useGameStore.getState().greatPurgeUsed).toBe(false)

      initiateGreatPurge()

      expect(useGameStore.getState().greatPurgeUsed).toBe(true)
    })
  })

  describe('voteInGreatPurge()', () => {
    beforeEach(() => {
      // Always initiate Great Purge before voting tests
      useGameStore.getState().initiateGreatPurge()
    })

    it('should record vote from a player', () => {
      const { voteInGreatPurge, players } = useGameStore.getState()
      const voter = players[0]
      const target = players[1]

      voteInGreatPurge(voter.id, target.id)

      const state = useGameStore.getState()
      expect(state.activeGreatPurge?.votes[voter.id]).toBe(target.id)
    })

    it('should record votes from multiple players', () => {
      const { voteInGreatPurge, players } = useGameStore.getState()

      voteInGreatPurge(players[0].id, players[1].id)
      voteInGreatPurge(players[1].id, players[2].id)
      voteInGreatPurge(players[2].id, players[0].id)

      const state = useGameStore.getState()
      expect(state.activeGreatPurge?.votes[players[0].id]).toBe(players[1].id)
      expect(state.activeGreatPurge?.votes[players[1].id]).toBe(players[2].id)
      expect(state.activeGreatPurge?.votes[players[2].id]).toBe(players[0].id)
    })

    it('should allow player to change their vote', () => {
      const { voteInGreatPurge, players } = useGameStore.getState()
      const voter = players[0]
      const firstTarget = players[1]
      const secondTarget = players[2]

      voteInGreatPurge(voter.id, firstTarget.id)
      expect(useGameStore.getState().activeGreatPurge?.votes[voter.id]).toBe(firstTarget.id)

      voteInGreatPurge(voter.id, secondTarget.id)
      expect(useGameStore.getState().activeGreatPurge?.votes[voter.id]).toBe(secondTarget.id)
    })

    it('should not record vote if Great Purge is not active', () => {
      const { voteInGreatPurge, players, resolveGreatPurge } = useGameStore.getState()

      // Resolve the Great Purge to deactivate it
      resolveGreatPurge()

      voteInGreatPurge(players[0].id, players[1].id)

      const state = useGameStore.getState()
      expect(state.activeGreatPurge).toBeNull()
    })

    it('should allow a player to vote for themselves', () => {
      const { voteInGreatPurge, players } = useGameStore.getState()
      const player = players[0]

      voteInGreatPurge(player.id, player.id)

      const state = useGameStore.getState()
      expect(state.activeGreatPurge?.votes[player.id]).toBe(player.id)
    })
  })

  describe('resolveGreatPurge()', () => {
    beforeEach(() => {
      useGameStore.getState().initiateGreatPurge()
    })

    it('should send player with most votes to Gulag', () => {
      const { voteInGreatPurge, resolveGreatPurge, players } = useGameStore.getState()
      const target = players[0]

      // Three players vote for target, one votes elsewhere
      voteInGreatPurge(players[1].id, target.id)
      voteInGreatPurge(players[2].id, target.id)
      voteInGreatPurge(players[3].id, target.id)
      voteInGreatPurge(players[0].id, players[1].id)

      resolveGreatPurge()

      const state = useGameStore.getState()
      const targetPlayer = state.players.find(p => p.id === target.id)
      expect(targetPlayer?.inGulag).toBe(true)
    })

    it('should send multiple players to Gulag in case of tie', () => {
      const { voteInGreatPurge, resolveGreatPurge, players } = useGameStore.getState()

      // Two players each get 2 votes (tie)
      voteInGreatPurge(players[0].id, players[2].id)
      voteInGreatPurge(players[1].id, players[2].id)
      voteInGreatPurge(players[2].id, players[3].id)
      voteInGreatPurge(players[3].id, players[3].id)

      resolveGreatPurge()

      const state = useGameStore.getState()
      const player2 = state.players.find(p => p.id === players[2].id)
      const player3 = state.players.find(p => p.id === players[3].id)

      expect(player2?.inGulag).toBe(true)
      expect(player3?.inGulag).toBe(true)
    })

    it('should add log entry with target names and vote count', () => {
      const { voteInGreatPurge, resolveGreatPurge, players } = useGameStore.getState()
      const target = players[0]

      // All players vote for target
      voteInGreatPurge(players[0].id, target.id)
      voteInGreatPurge(players[1].id, target.id)
      voteInGreatPurge(players[2].id, target.id)
      voteInGreatPurge(players[3].id, target.id)

      const initialLogLength = useGameStore.getState().gameLog.length
      resolveGreatPurge()

      const logs = useGameStore.getState().gameLog
      expect(logs.length).toBeGreaterThan(initialLogLength)

      const purgeLog = logs.find(log => log.message.includes('Great Purge is complete'))
      expect(purgeLog).toBeDefined()
      expect(purgeLog?.message).toContain(target.name)
      expect(purgeLog?.message).toContain('4')
    })

    it('should add log entry mentioning all tied players', () => {
      const { voteInGreatPurge, resolveGreatPurge, players } = useGameStore.getState()

      // Two players tied with 2 votes each
      voteInGreatPurge(players[0].id, players[2].id)
      voteInGreatPurge(players[1].id, players[2].id)
      voteInGreatPurge(players[2].id, players[3].id)
      voteInGreatPurge(players[3].id, players[3].id)

      resolveGreatPurge()

      const logs = useGameStore.getState().gameLog
      const purgeLog = logs.find(log => log.message.includes('Great Purge is complete'))

      expect(purgeLog).toBeDefined()
      expect(purgeLog?.message).toContain(players[2].name)
      expect(purgeLog?.message).toContain(players[3].name)
      expect(purgeLog?.message).toContain('2')
    })

    it('should set activeGreatPurge to null after resolution', () => {
      const { voteInGreatPurge, resolveGreatPurge, players } = useGameStore.getState()

      voteInGreatPurge(players[0].id, players[1].id)

      expect(useGameStore.getState().activeGreatPurge).not.toBeNull()

      resolveGreatPurge()

      expect(useGameStore.getState().activeGreatPurge).toBeNull()
    })

    it('should not send player to Gulag if they are already in Gulag', () => {
      const { voteInGreatPurge, resolveGreatPurge, sendToGulag, players } = useGameStore.getState()
      const target = players[0]

      // Send target to Gulag first
      sendToGulag(target.id, 'denouncementGuilty')

      const initialGulagTurns = useGameStore.getState().players.find(p => p.id === target.id)?.gulagTurns

      // All players vote for target
      voteInGreatPurge(players[1].id, target.id)
      voteInGreatPurge(players[2].id, target.id)
      voteInGreatPurge(players[3].id, target.id)

      resolveGreatPurge()

      const finalGulagTurns = useGameStore.getState().players.find(p => p.id === target.id)?.gulagTurns

      // Gulag turns should not change (no duplicate sendToGulag call)
      expect(finalGulagTurns).toBe(initialGulagTurns)

      // Player should still be in Gulag
      const targetPlayer = useGameStore.getState().players.find(p => p.id === target.id)
      expect(targetPlayer?.inGulag).toBe(true)
    })

    it('should handle Great Purge with no votes', () => {
      const { resolveGreatPurge } = useGameStore.getState()

      // No votes cast
      resolveGreatPurge()

      const state = useGameStore.getState()
      expect(state.activeGreatPurge).toBeNull()

      // No players should be in Gulag from this
      const playersInGulag = state.players.filter(p => p.inGulag)
      expect(playersInGulag.length).toBe(0)
    })

    it('should handle Great Purge when activeGreatPurge is null', () => {
      const { resolveGreatPurge } = useGameStore.getState()

      // Resolve first time
      resolveGreatPurge()

      // Try to resolve again when already null
      resolveGreatPurge()

      // Should not error
      expect(useGameStore.getState().activeGreatPurge).toBeNull()
    })

  })

  describe('Great Purge - Integration', () => {
    it('should complete full Great Purge flow from initiation to resolution', () => {
      const { initiateGreatPurge, voteInGreatPurge, resolveGreatPurge, players } = useGameStore.getState()

      // Step 1: Initiate
      initiateGreatPurge()
      expect(useGameStore.getState().activeGreatPurge?.isActive).toBe(true)

      // Step 2: All players vote
      voteInGreatPurge(players[0].id, players[1].id)
      voteInGreatPurge(players[1].id, players[1].id)
      voteInGreatPurge(players[2].id, players[1].id)
      voteInGreatPurge(players[3].id, players[0].id)

      // Step 3: Resolve
      resolveGreatPurge()

      const state = useGameStore.getState()
      expect(state.activeGreatPurge).toBeNull()
      expect(state.greatPurgeUsed).toBe(true)

      const targetPlayer = state.players.find(p => p.id === players[1].id)
      expect(targetPlayer?.inGulag).toBe(true)
    })

    it('should maintain Great Purge used flag across multiple resolves', () => {
      const { initiateGreatPurge, resolveGreatPurge } = useGameStore.getState()

      initiateGreatPurge()
      expect(useGameStore.getState().greatPurgeUsed).toBe(true)

      resolveGreatPurge()
      expect(useGameStore.getState().greatPurgeUsed).toBe(true)
    })
  })
})
