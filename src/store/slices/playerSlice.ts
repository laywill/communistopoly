// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { StateCreator } from 'zustand'
import type { GameState, Player, PartyRank } from '../../types/game'

// State interface
export interface PlayerSliceState {
  players: Player[]
  stalinPlayerId: string | null
  currentPlayerIndex: number
}

// Actions interface
export interface PlayerSliceActions {
  // Player initialization and setup
  initializePlayers: (playerSetups: { name: string, piece: Player['piece'], isStalin: boolean }[]) => void

  // Player updates
  updatePlayer: (playerId: string, updates: Partial<Player>) => void
  setCurrentPlayer: (index: number) => void

  // Rank management
  promotePlayer: (playerId: string) => void
  demotePlayer: (playerId: string) => void

  // Queries
  getPlayer: (playerId: string) => Player | undefined
  getCurrentPlayer: () => Player | undefined
  getActivePlayers: () => Player[]
}

// Combined type
export type PlayerSlice = PlayerSliceState & PlayerSliceActions

// Initial state
export const initialPlayerState: PlayerSliceState = {
  players: [],
  stalinPlayerId: null,
  currentPlayerIndex: 0,
}

// Slice creator
export const createPlayerSlice: StateCreator<
  GameState,
  [],
  [],
  PlayerSlice
> = (set, get) => ({
  ...initialPlayerState,

  initializePlayers: (playerSetups) => {
    const players: Player[] = playerSetups.map((setup, index: number) => ({
      id: `player-${String(index)}`,
      name: setup.name,
      piece: setup.piece,
      rank: setup.piece === 'redStar' ? 'partyMember' : 'proletariat',
      rubles: 1500,
      position: 0,
      properties: [],
      inGulag: false,
      gulagTurns: 0,
      isEliminated: false,
      isStalin: setup.isStalin,
      correctTestAnswers: 0,
      consecutiveFailedTests: 0,
      underSuspicion: false,
      skipNextTurn: false,
      usedRailwayGulagPower: false,
      vouchingFor: null,
      vouchedByRound: null,
      debt: null,
      debtCreatedAtRound: null,
      hasUsedTankGulagImmunity: false,
      tankRequisitionUsedThisLap: false,
      lapsCompleted: 0,
      hasUsedSickleHarvest: false,
      sickleMotherlandForgotten: false,
      hasUsedLeninSpeech: false,
      hasUsedIronCurtainDisappear: false,
      hasFreeFromGulagCard: false,
      vodkaUseCount: 0,
      ironCurtainClaimedRubles: 1500,
      owesFavourTo: [],
      hasUsedSiberianCampsGulag: false,
      kgbTestPreviewsUsedThisRound: 0,
      hasUsedMinistryTruthRewrite: false,
      hasUsedPravdaPressRevote: false
    }))

    const stalinPlayer = players.find(p => p.isStalin)
    const nonStalinPlayers = players.filter(p => !p.isStalin)

    // Calculate state treasury based on player count
    const playerCount = nonStalinPlayers.length
    const stateTreasury = playerCount * 1500

    set({
      players,
      stalinPlayerId: stalinPlayer?.id ?? null,
      currentPlayerIndex: 1, // Start with first non-Stalin player
      stateTreasury
    })
  },

  updatePlayer: (playerId, updates) => {
    set((state) => {
      const player = state.players.find(p => p.id === playerId)

      // BREAD LOAF ABILITY: Enforce 1000₽ wealth cap
      if (player?.piece === 'breadLoaf' && updates.rubles !== undefined) {
        if (updates.rubles > 1000) {
          const excess = updates.rubles - 1000
          updates.rubles = 1000

          // Donate excess to State
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          get().adjustTreasury(excess)
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          get().addLogEntry({
            type: 'payment',
            message: `${player.name}'s Bread Loaf forces donation of ₽${String(excess)} to the State (max 1000₽)`,
            playerId
          })
        }
      }

      return {
        players: state.players.map((p) =>
          p.id === playerId ? { ...p, ...updates } : p
        )
      }
    })
  },

  setCurrentPlayer: (index) => { set({ currentPlayerIndex: index }); },

  promotePlayer: (playerId) => {
    const state = get()
    const player = state.players.find(p => p.id === playerId)
    if (player == null) return

    const rankOrder: Player['rank'][] = ['proletariat', 'partyMember', 'commissar', 'innerCircle']
    const currentRankIndex = rankOrder.indexOf(player.rank)

    if (currentRankIndex < rankOrder.length - 1) {
      const newRank = rankOrder[currentRankIndex + 1]
      get().updatePlayer(playerId, { rank: newRank })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      get().addLogEntry({
        type: 'rank',
        message: `${player.name} promoted to ${newRank}!`,
        playerId
      })
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      get().addLogEntry({
        type: 'system',
        message: `${player.name} is already at the highest rank (Inner Circle)`,
        playerId
      })
    }
  },

  demotePlayer: (playerId) => {
    const state = get()
    const player = state.players.find((p) => p.id === playerId)
    if (player == null) return

    const rankOrder: Player['rank'][] = ['proletariat', 'partyMember', 'commissar', 'innerCircle']
    const currentRankIndex = rankOrder.indexOf(player.rank)

    if (currentRankIndex > 0) {
      const newRank = rankOrder[currentRankIndex - 1]
      get().updatePlayer(playerId, { rank: newRank })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      get().addLogEntry({
        type: 'rank',
        message: `${player.name} demoted to ${newRank}`,
        playerId
      })

      // RED STAR ABILITY: If demoted to Proletariat, immediate execution
      if (player.piece === 'redStar' && newRank === 'proletariat') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        get().addLogEntry({
          type: 'system',
          message: `${player.name}'s Red Star has fallen to Proletariat - IMMEDIATE EXECUTION!`,
          playerId
        })
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        get().eliminatePlayer(playerId, 'redStarDemotion')
      }
    }
  },

  getPlayer: (playerId) => {
    return get().players.find(p => p.id === playerId)
  },

  getCurrentPlayer: () => {
    const state = get()
    return state.players[state.currentPlayerIndex]
  },

  getActivePlayers: () => {
    return get().players.filter(p => !p.isEliminated && !p.isStalin)
  },
})
