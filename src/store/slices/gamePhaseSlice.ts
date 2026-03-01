// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { StateCreator } from 'zustand'
import type { GameStore } from '../types/storeTypes'
import type { GamePhase, Player, PlayerStatistics } from '../../types/game'
import { shuffleDirectiveDeck } from '../../data/partyDirectiveCards'
import { initializePlayerStats } from '../helpers/playerStats'
import { STARTING_RUBLES } from '../constants'
import { initialPlayerState } from './playerSlice'
import { initialPropertyState } from './propertySlice'
import { initialTreasuryState } from './treasurySlice'
import { initialDiceState } from './diceSlice'
import { initialUiState } from './uiSlice'
import { initialLogState } from './logSlice'
import { initialVoucherState } from './voucherSlice'
import { initialConfessionState } from './confessionSlice'
import { initialTradeState } from './tradeSlice'
import { initialTribunalState } from './tribunalSlice'
import { initialSpecialDecreesState } from './specialDecreesSlice'
import { initialCardState } from './cardSlice'
import { initialGameEndState } from './gameEndSlice'
import { initialStatisticsState } from './statisticsSlice'

// Slice state interface
export interface GamePhaseSliceState {
  gamePhase: GamePhase
}

// Slice actions interface
export interface GamePhaseSliceActions {
  setGamePhase: (phase: GamePhase) => void
  startNewGame: () => void
  resetGame: () => void
  initializePlayers: (playerSetups: { name: string, piece: Player['piece'], isStalin: boolean }[]) => void
  payQuota: (payerId: string, custodianId: string, amount: number) => void
}

// Combined slice type
export type GamePhaseSlice = GamePhaseSliceState & GamePhaseSliceActions

// Initial state for this slice
export const initialGamePhaseState: GamePhaseSliceState = {
  gamePhase: 'welcome'
}

// Combined initial state used by startNewGame and resetGame, composed from all slice initial states
const combinedInitialState = {
  ...initialGamePhaseState,
  ...initialPlayerState,
  ...initialPropertyState,
  ...initialTreasuryState,
  ...initialDiceState,
  ...initialUiState,
  ...initialLogState,
  ...initialVoucherState,
  ...initialConfessionState,
  ...initialTradeState,
  ...initialTribunalState,
  ...initialSpecialDecreesState,
  ...initialCardState,
  ...initialGameEndState,
  ...initialStatisticsState
}

// Slice creator with full typing
export const createGamePhaseSlice: StateCreator<
  GameStore,  // Full store type for get() access
  [],         // Middleware tuple (empty)
  [],         // Middleware tuple (empty)
  GamePhaseSlice    // This slice's return type
> = (set, get) => ({
  // Spread initial state
  ...initialGamePhaseState,

  // Simple game phase setter
  setGamePhase: (phase) => { set({ gamePhase: phase }) },

  // Reset to setup phase for a new game, preserving all initial state
  startNewGame: () => { set({ ...combinedInitialState, gamePhase: 'setup' }) },

  // Reset to welcome phase and clear persisted save data
  resetGame: () => {
    // Clear localStorage save
    localStorage.removeItem('communistopoly-save')

    // Reset all state to initial values
    set({
      ...combinedInitialState,
      gamePhase: 'welcome'
    })
  },

  // Initialise players with correct default values, state treasury, and statistics
  initializePlayers: (playerSetups) => {
    const players: Player[] = playerSetups.map((setup, index: number) => ({
      id: `player-${String(index)}`,
      name: setup.name,
      piece: setup.piece,
      rank: setup.piece === 'redStar' ? 'partyMember' : 'proletariat',
      rubles: STARTING_RUBLES,
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
      ironCurtainClaimedRubles: STARTING_RUBLES, // Start with initial amount claimed
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
    const stateTreasury = playerCount * STARTING_RUBLES // Starting treasury

    // Initialise player statistics for non-Stalin players
    const playerStats: Record<string, PlayerStatistics> = {}
    players.forEach(player => {
      if (!player.isStalin) {
        playerStats[player.id] = initializePlayerStats()
      }
    })

    const firstNonStalinIndex = players.findIndex(p => !p.isStalin)
    set({
      players,
      stalinPlayerId: stalinPlayer?.id ?? null,
      currentPlayerIndex: firstNonStalinIndex >= 0 ? firstNonStalinIndex : 0,
      stateTreasury,
      partyDirectiveDeck: shuffleDirectiveDeck().map(card => card.id),
      partyDirectiveDiscard: [],
      communistTestUsedQuestions: new Set(),
      gameStatistics: {
        gameStartTime: new Date(),
        totalTurns: 0,
        playerStats,
        totalDenouncements: 0,
        totalTribunals: 0,
        totalGulagSentences: 0,
        stateTreasuryPeak: stateTreasury
      }
    })

    // Initialise properties via propertySlice
    get().initializeProperties()
  },

  // Transfer rubles between two players and log the payment
  payQuota: (payerId, custodianId, amount) => {
    const state = get()
    const payer = state.players.find((p) => p.id === payerId)
    const custodian = state.players.find((p) => p.id === custodianId)
    if (payer == null || custodian == null) return

    // Transfer rubles - fetch fresh custodian balance after payer update
    get().updatePlayer(payerId, { rubles: payer.rubles - amount })
    const freshCustodian = get().players.find(p => p.id === custodianId)
    if (freshCustodian != null) {
      get().updatePlayer(custodianId, { rubles: freshCustodian.rubles + amount })
    }

    get().addLogEntry({
      type: 'payment',
      message: `${payer.name} paid ₽${String(amount)} quota to ${custodian.name}`,
      playerId: payerId
    })
  }
})
