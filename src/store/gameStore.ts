// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { GameState, Player, PlayerStatistics } from '../types/game'
import { shuffleDirectiveDeck } from '../data/partyDirectiveCards'
import { calculateTotalWealth } from './helpers/wealthCalculation'
import { initializePlayerStats } from './helpers/playerStats'
import { createUiSlice, initialUiState } from './slices/uiSlice'
import { createLogSlice, initialLogState } from './slices/logSlice'
import { createStatisticsSlice, initialStatisticsState } from './slices/statisticsSlice'
import { createDiceSlice, initialDiceState } from './slices/diceSlice'
import { createTreasurySlice, initialTreasuryState } from './slices/treasurySlice'
import { createPlayerSlice, initialPlayerState } from './slices/playerSlice'
import { createPropertySlice, initialPropertyState } from './slices/propertySlice'
import { createMovementSlice } from './slices/movementSlice'
import { createGulagSlice } from './slices/gulagSlice'
import { createVoucherSlice, initialVoucherState } from './slices/voucherSlice'
import { createConfessionSlice, initialConfessionState } from './slices/confessionSlice'
import { createTradeSlice, initialTradeState } from './slices/tradeSlice'
import { createDebtAndEliminationSlice } from './slices/debtAndEliminationSlice'
import { createTribunalSlice, initialTribunalState } from './slices/tribunalSlice'
import { createSpecialDecreesSlice, initialSpecialDecreesState } from './slices/specialDecreesSlice'
import { createCardSlice, initialCardState } from './slices/cardSlice'
import { createPieceAbilitiesSlice } from './slices/pieceAbilitiesSlice'
import { createPropertyAbilitiesSlice } from './slices/propertyAbilitiesSlice'
import type { GameStore, GameActions } from './types/storeTypes'

// Re-export helper functions for testing
export { calculateTotalWealth, initializePlayerStats }

// Re-export GameActions for backward compatibility
export type { GameActions }

const initialState: GameState = {
  gamePhase: 'welcome',
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

  // Game end tracking
  gameEndCondition: null,
  winnerId: null,
  showEndScreen: false,

  ...initialStatisticsState,

  // Unanimous end vote
  endVoteInProgress: false,
  endVoteInitiator: null,
  endVotes: {}
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get, api) => ({
      ...initialState,
      ...createUiSlice(set, get, api),
      ...createLogSlice(set, get, api),
      ...createStatisticsSlice(set, get, api),
      ...createDiceSlice(set, get, api),
      ...createTreasurySlice(set, get, api),
      ...createPlayerSlice(set, get, api),
      ...createPropertySlice(set, get, api),
      ...createMovementSlice(set, get, api),
      ...createGulagSlice(set, get, api),
      ...createVoucherSlice(set, get, api),
      ...createConfessionSlice(set, get, api),
      ...createTradeSlice(set, get, api),
      ...createDebtAndEliminationSlice(set, get, api),
      ...createTribunalSlice(set, get, api),
      ...createSpecialDecreesSlice(set, get, api),
      ...createCardSlice(set, get, api),
      ...createPieceAbilitiesSlice(set, get, api),
      ...createPropertyAbilitiesSlice(set, get, api),

      setGamePhase: (phase) => set({ gamePhase: phase }),

      startNewGame: () => set({ ...initialState, gamePhase: 'setup' }),

      resetGame: () => {
        // Clear localStorage save
        localStorage.removeItem('communistopoly-save')

        // Reset all state to initial values
        set({
          ...initialState,
          gamePhase: 'welcome'
        })
      },

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
          ironCurtainClaimedRubles: 1500, // Start with initial amount claimed
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
        const stateTreasury = playerCount * 1500 // Starting treasury

        // Initialize player statistics
        const playerStats: Record<string, PlayerStatistics> = {}
        players.forEach(player => {
          if (!player.isStalin) {
            playerStats[player.id] = initializePlayerStats()
          }
        })

        set({
          players,
          stalinPlayerId: stalinPlayer?.id ?? null,
          currentPlayerIndex: 1, // Start with first non-Stalin player
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

        // Initialize properties
        get().initializeProperties()
      },

      // Turn management and movement - moved to movementSlice
      // movePlayer, resolveCurrentSpace, finishMoving, endTurn, handleStoyPassing, handleStoyPilfer

      // Gulag management - moved to gulagSlice
      // sendToGulag, checkRedStarExecutionAfterGulagRelease, handleGulagTurn, attemptGulagEscape, checkFor10TurnElimination are now in gulagSlice

      // Piece abilities - moved to pieceAbilitiesSlice
      // tankRequisition, sickleHarvest, ironCurtainDisappear, leninSpeech are now in pieceAbilitiesSlice

      payQuota: (payerId, custodianId, amount) => {
        const state = get()
        const payer = state.players.find((p) => p.id === payerId)
        const custodian = state.players.find((p) => p.id === custodianId)
        if (payer == null || custodian == null) return

        // Transfer rubles
        get().updatePlayer(payerId, { rubles: payer.rubles - amount })
        get().updatePlayer(custodianId, { rubles: custodian.rubles + amount })

        get().addLogEntry({
          type: 'payment',
          message: `${payer.name} paid ₽${String(amount)} quota to ${custodian.name}`,
          playerId: payerId
        })
      },

      checkGameEnd: () => {
        const state = get()
        const activePlayers = state.players.filter(p => !p.isEliminated && !p.isStalin)

        // Survivor victory
        if (activePlayers.length === 1) {
          get().endGame('survivor', activePlayers[0].id)
          return 'survivor'
        }

        // Stalin victory (all eliminated)
        if (activePlayers.length === 0) {
          get().endGame('stalinWins', null)
          return 'stalinWins'
        }

        return null
      },

      endGame: (condition, winnerId) => {
        // Calculate final statistics
        get().calculateFinalStats()

        set({
          gamePhase: 'ended',
          gameEndCondition: condition,
          winnerId,
          showEndScreen: true
        })

        get().addLogEntry({
          type: 'system',
          message: `Game Over: ${condition === 'survivor' ? 'Survivor Victory!' : condition === 'stalinWins' ? 'Stalin Wins!' : condition === 'unanimous' ? 'Unanimous Vote to End' : 'Game Ended'}`
        })
      },

      initiateEndVote: (initiatorId) => {
        set({
          endVoteInProgress: true,
          endVoteInitiator: initiatorId,
          endVotes: {}
        })

        const initiator = get().players.find(p => p.id === initiatorId)
        const initiatorName = initiator?.name ?? 'Unknown'
        get().addLogEntry({
          type: 'system',
          message: `Comrade ${initiatorName} has initiated a vote to end the game. All players must vote unanimously to end.`
        })
      },

      castEndVote: (playerId, vote) => {
        const state = get()

        set((state) => ({
          endVotes: { ...state.endVotes, [playerId]: vote }
        }))

        const player = state.players.find(p => p.id === playerId)
        const playerName = player?.name ?? 'Unknown'
        get().addLogEntry({
          type: 'system',
          message: `${playerName} voted ${vote ? 'YES' : 'NO'} to end the game`
        })

        // Check if all active players have voted
        const activePlayerIds = state.players
          .filter(p => !p.isStalin && !p.isEliminated)
          .map(p => p.id)
        const allVoted = activePlayerIds.every(id => id in state.endVotes || id in get().endVotes)

        if (allVoted) {
          const votes = get().endVotes
          const unanimous = activePlayerIds.every(id => votes[id])

          if (unanimous) {
            get().endGame('unanimous', null)
          } else {
            set({ endVoteInProgress: false, endVoteInitiator: null, endVotes: {} })
            get().addLogEntry({
              type: 'system',
              message: 'End vote failed - not unanimous'
            })
          }
        }
      },

      // Card system - moved to cardSlice

      // Piece abilities - moved to pieceAbilitiesSlice

      // Property special abilities - moved to propertyAbilitiesSlice
      // siberianCampsGulag, approveHammerAbility, kgbPreviewTest, ministryTruthRewrite,
      // approveMinistryTruthRewrite, pravdaPressRevote are now in propertyAbilitiesSlice

      // Denouncement and Tribunal System - moved to tribunalSlice
      // canPlayerDenounce, initiateDenouncement, getWitnessRequirement, advanceTribunalPhase, addWitness, renderTribunalVerdict are now in tribunalSlice

      // Special Decrees - moved to specialDecreesSlice
      // initiateGreatPurge, voteInGreatPurge, resolveGreatPurge, initiateFiveYearPlan, contributeToFiveYearPlan, resolveFiveYearPlan, grantHeroOfSovietUnion, isHeroOfSovietUnion are now in specialDecreesSlice
    }),
    {
      name: 'communistopoly-save',
      partialize: (state) => ({
        gamePhase: state.gamePhase,
        players: state.players,
        stalinPlayerId: state.stalinPlayerId,
        currentPlayerIndex: state.currentPlayerIndex,
        properties: state.properties,
        stateTreasury: state.stateTreasury,
        turnPhase: state.turnPhase,
        doublesCount: state.doublesCount,
        hasRolled: state.hasRolled,
        roundNumber: state.roundNumber,
        dice: state.dice,
        gameLog: state.gameLog,
        activeVouchers: state.activeVouchers,
        pendingBribes: state.pendingBribes,
        partyDirectiveDeck: state.partyDirectiveDeck,
        partyDirectiveDiscard: state.partyDirectiveDiscard,
        communistTestUsedQuestions: state.communistTestUsedQuestions,
        gameEndCondition: state.gameEndCondition,
        winnerId: state.winnerId,
        showEndScreen: state.showEndScreen,
        gameStatistics: state.gameStatistics,
        endVoteInProgress: state.endVoteInProgress,
        endVoteInitiator: state.endVoteInitiator,
        endVotes: state.endVotes,
        confessions: state.confessions,
        denouncementsThisRound: state.denouncementsThisRound,
        activeTribunal: state.activeTribunal,
        greatPurgeUsed: state.greatPurgeUsed,
        activeGreatPurge: state.activeGreatPurge,
        activeFiveYearPlan: state.activeFiveYearPlan,
        heroesOfSovietUnion: state.heroesOfSovietUnion
      })
    }
  )
)
