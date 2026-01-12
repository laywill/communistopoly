// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../../../store/gameStore'

describe('gameStore - End Game Voting', () => {
  const setupPlayers = () => {
    const { initializePlayers } = useGameStore.getState()
    initializePlayers([
      { name: 'Player 1', piece: 'sickle', isStalin: false },
      { name: 'Player 2', piece: 'hammer', isStalin: false },
      { name: 'Player 3', piece: 'star', isStalin: false },
      { name: 'Stalin', piece: 'boot', isStalin: true }
    ])
  }

  beforeEach(() => {
    useGameStore.getState().resetGame()
    setupPlayers()
  })

  describe('initiateEndVote()', () => {
    it('should initiate end game vote with correct state', () => {
      const { initiateEndVote, players } = useGameStore.getState()
      const initiator = players[0]

      initiateEndVote(initiator.id)

      const state = useGameStore.getState()
      expect(state.endVoteInProgress).toBe(true)
      expect(state.endVoteInitiator).toBe(initiator.id)
      expect(state.endVotes).toEqual({})
    })

    it('should add log entry when end vote is initiated', () => {
      const { initiateEndVote, players } = useGameStore.getState()
      const initiator = players[0]
      const initialLogLength = useGameStore.getState().gameLog.length

      initiateEndVote(initiator.id)

      const logs = useGameStore.getState().gameLog
      expect(logs.length).toBe(initialLogLength + 1)
      expect(logs[logs.length - 1].type).toBe('system')
      expect(logs[logs.length - 1].message).toContain(initiator.name)
      expect(logs[logs.length - 1].message).toContain('initiated a vote to end the game')
      expect(logs[logs.length - 1].message).toContain('unanimously')
    })

    it('should handle unknown initiator gracefully', () => {
      const { initiateEndVote } = useGameStore.getState()

      initiateEndVote('unknown-id')

      const state = useGameStore.getState()
      expect(state.endVoteInProgress).toBe(true)
      expect(state.endVoteInitiator).toBe('unknown-id')

      const logs = useGameStore.getState().gameLog
      expect(logs[logs.length - 1].message).toContain('Unknown')
    })
  })

  describe('castEndVote()', () => {
    it('should record vote for a player', () => {
      const { initiateEndVote, castEndVote, players } = useGameStore.getState()
      const initiator = players[0]

      initiateEndVote(initiator.id)
      castEndVote(initiator.id, true)

      const state = useGameStore.getState()
      expect(state.endVotes[initiator.id]).toBe(true)
    })

    it('should add log entry when player votes', () => {
      const { initiateEndVote, castEndVote, players } = useGameStore.getState()
      const voter = players[0]

      initiateEndVote(voter.id)
      const initialLogLength = useGameStore.getState().gameLog.length

      castEndVote(voter.id, true)

      const logs = useGameStore.getState().gameLog
      expect(logs.length).toBe(initialLogLength + 1)
      expect(logs[logs.length - 1].type).toBe('system')
      expect(logs[logs.length - 1].message).toContain(voter.name)
      expect(logs[logs.length - 1].message).toContain('voted YES')
    })

    it('should add log entry for NO vote', () => {
      const { initiateEndVote, castEndVote, players } = useGameStore.getState()
      const voter = players[0]

      initiateEndVote(voter.id)
      castEndVote(voter.id, false)

      const logs = useGameStore.getState().gameLog
      expect(logs[logs.length - 1].message).toContain('voted NO')
    })

    it('should end game when all players vote YES unanimously', () => {
      const { initiateEndVote, castEndVote, players } = useGameStore.getState()
      const nonStalinPlayers = players.filter(p => !p.isStalin)

      initiateEndVote(nonStalinPlayers[0].id)

      // All non-Stalin players vote YES
      nonStalinPlayers.forEach(player => {
        castEndVote(player.id, true)
      })

      const state = useGameStore.getState()
      expect(state.gamePhase).toBe('ended')
      expect(state.gameEndCondition).toBe('unanimous')
      expect(state.winnerId).toBeNull()
    })

    it('should not end game when vote is not unanimous', () => {
      const { initiateEndVote, castEndVote, players } = useGameStore.getState()
      const nonStalinPlayers = players.filter(p => !p.isStalin)

      initiateEndVote(nonStalinPlayers[0].id)

      // First two vote YES, last one votes NO
      castEndVote(nonStalinPlayers[0].id, true)
      castEndVote(nonStalinPlayers[1].id, true)
      castEndVote(nonStalinPlayers[2].id, false)

      const state = useGameStore.getState()
      expect(state.gamePhase).not.toBe('ended')
      expect(state.endVoteInProgress).toBe(false)
      expect(state.endVoteInitiator).toBeNull()
      expect(state.endVotes).toEqual({})
    })

    it('should add log entry when vote fails', () => {
      const { initiateEndVote, castEndVote, players } = useGameStore.getState()
      const nonStalinPlayers = players.filter(p => !p.isStalin)

      initiateEndVote(nonStalinPlayers[0].id)

      // Vote YES, YES, NO
      castEndVote(nonStalinPlayers[0].id, true)
      castEndVote(nonStalinPlayers[1].id, true)
      const initialLogLength = useGameStore.getState().gameLog.length
      castEndVote(nonStalinPlayers[2].id, false)

      const logs = useGameStore.getState().gameLog
      expect(logs[logs.length - 1].type).toBe('system')
      expect(logs[logs.length - 1].message).toContain('End vote failed')
      expect(logs[logs.length - 1].message).toContain('not unanimous')
    })

    it('should not count votes from eliminated players', () => {
      const { initiateEndVote, castEndVote, eliminatePlayer, players } = useGameStore.getState()
      const nonStalinPlayers = players.filter(p => !p.isStalin)

      // Eliminate the third player
      eliminatePlayer(nonStalinPlayers[2].id, 'bankruptcy')

      initiateEndVote(nonStalinPlayers[0].id)

      // Only the two remaining players vote YES
      castEndVote(nonStalinPlayers[0].id, true)
      castEndVote(nonStalinPlayers[1].id, true)

      // Should end game since all active players voted YES
      const state = useGameStore.getState()
      expect(state.gamePhase).toBe('ended')
      expect(state.gameEndCondition).toBe('unanimous')
    })

    it('should not count votes from Stalin', () => {
      const { initiateEndVote, castEndVote, players } = useGameStore.getState()
      const nonStalinPlayers = players.filter(p => !p.isStalin)
      const stalin = players.find(p => p.isStalin)

      initiateEndVote(nonStalinPlayers[0].id)

      // All non-Stalin players vote YES
      nonStalinPlayers.forEach(player => {
        castEndVote(player.id, true)
      })

      // Should end even though Stalin hasn't voted (Stalin's vote is not counted)
      const state = useGameStore.getState()
      expect(state.gamePhase).toBe('ended')
    })

    it('should wait for all active players to vote before checking result', () => {
      const { initiateEndVote, castEndVote, players } = useGameStore.getState()
      const nonStalinPlayers = players.filter(p => !p.isStalin)

      initiateEndVote(nonStalinPlayers[0].id)

      // Only first player votes
      castEndVote(nonStalinPlayers[0].id, true)

      const state = useGameStore.getState()
      expect(state.gamePhase).not.toBe('ended')
      expect(state.endVoteInProgress).toBe(true)
    })

    it('should handle unknown voter gracefully', () => {
      const { initiateEndVote, castEndVote } = useGameStore.getState()

      initiateEndVote('player-1')
      castEndVote('unknown-id', true)

      const logs = useGameStore.getState().gameLog
      expect(logs[logs.length - 1].message).toContain('Unknown')
    })

    it('should allow player to change their vote', () => {
      const { initiateEndVote, castEndVote, players } = useGameStore.getState()
      const nonStalinPlayers = players.filter(p => !p.isStalin)

      initiateEndVote(nonStalinPlayers[0].id)

      // First player votes NO
      castEndVote(nonStalinPlayers[0].id, false)
      expect(useGameStore.getState().endVotes[nonStalinPlayers[0].id]).toBe(false)

      // First player changes to YES
      castEndVote(nonStalinPlayers[0].id, true)
      expect(useGameStore.getState().endVotes[nonStalinPlayers[0].id]).toBe(true)
    })
  })
})
