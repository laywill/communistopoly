// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// Slices
import {
  createCardSlice,
  initialCardState,
  type CardSlice,
  createGulagSlice,
  initialGulagState,
  type GulagSlice,
  createPropertySlice,
  initialPropertyState,
  type PropertySlice,
  createTribunalSlice,
  initialTribunalState,
  type TribunalSlice
} from './slices'
import { createPlayerSlice, initialPlayerState, type PlayerSlice } from './slices/playerSlice'
import { createGameFlowSlice, initialGameFlowState, type GameFlowSlice } from './slices/gameFlowSlice'

// Services
import { createGulagService, type GulagService } from '../services/GulagService'
import { createPropertyService, type PropertyService } from '../services/PropertyService'
import { createTurnManager, type TurnManager } from '../services/TurnManager'
import { createStoyService, type StoyService } from '../services/StoyService'

// ============================================
// COMBINED STORE TYPE
// ============================================

// Compatibility interface for old API
interface CompatibilityLayer {
  // Old property names
  currentPlayerIndex: number
  roundNumber: number
  dice: [number, number]
  turnPhase: import('./slices/gameFlowSlice').GamePhase
  hasRolled: boolean
  isRolling: boolean
  pendingAction: any
  activeTradeOffers: any[]
  gameEndCondition: any
  showEndScreen: boolean
  gameStatistics: any
  endVoteInProgress: boolean
  endVoteInitiator: string | null
  endVotes: Record<string, boolean>
  confessions: any[]
  greatPurgeUsed: boolean
  activeGreatPurge: any
  activeFiveYearPlan: any
  heroesOfSovietUnion: any[]
  stalinPlayerId: string | null

  // Old methods
  initializePlayers: (playerSetups: Array<{ name: string, piece: any, isStalin: boolean }>) => void
  startNewGame: () => void
  updatePlayer: (playerId: string, updates: any) => void
  setCurrentPlayer: (index: number) => void
  rollDice: () => void
  finishRolling: () => void
  movePlayer: (playerId: string, spaces: number) => void
  finishMoving: () => void
  setTurnPhase: (phase: any) => void
  setPendingAction: (action: any) => void
  addLogEntry: (entry: any) => void
  adjustTreasury: (amount: number) => void
  createDebt: (debtorId: string, creditorId: string, amount: number, reason: string) => void
  submitBribe: (playerId: string, amount: number, reason: string) => void
  answerCommunistTest: (question: any, answer: string, readerId: string) => void
  applyDirectiveEffect: (card: any, playerId: string) => void
  ironCurtainDisappear: (playerId: string, propertyId: number) => void
  leninSpeech: (playerId: string, applauders: string[]) => void
  submitConfession: (prisonerId: string, confession: string) => void
}

type GameStore =
  // Slices
  & CardSlice
  & GulagSlice
  & PropertySlice
  & TribunalSlice
  & PlayerSlice
  & GameFlowSlice
  // Services
  & GulagService
  & PropertyService
  & TurnManager
  & StoyService
  // Compatibility
  & CompatibilityLayer
  // Reset
  & { resetGame: () => void }

// ============================================
// STORE CREATION
// ============================================

export const useGameStore = create<GameStore>()(
  persist(
    (set, get, api) => {
      // ─────────────────────────────────────────
      // STEP 1: Create all slices
      // ─────────────────────────────────────────
      const slices = {
        ...createCardSlice(set, get, api),
        ...createGulagSlice(set, get, api),
        ...createPropertySlice(set, get, api),
        ...createTribunalSlice(set, get, api),
        ...createPlayerSlice(set, get, api),
        ...createGameFlowSlice(set, get, api),
      }

      // ─────────────────────────────────────────
      // STEP 2: Create services with store getter
      // Services get live access to complete store
      // ─────────────────────────────────────────
      const gulagService = createGulagService(() => get())
      const propertyService = createPropertyService(() => get())
      const turnManager = createTurnManager(() => get())
      const stoyService = createStoyService(() => get())

      // ─────────────────────────────────────────
      // STEP 3: Compose complete store
      // ─────────────────────────────────────────
      const store: GameStore = {
        ...slices,
        ...gulagService,
        ...propertyService,
        ...turnManager,
        ...stoyService,

        resetGame: () => {
          set({
            ...initialCardState,
            ...initialGulagState,
            ...initialPropertyState,
            ...initialTribunalState,
            ...initialPlayerState,
            ...initialGameFlowState,
          })
        },

        // ─────────────────────────────────────────
        // COMPATIBILITY SHIMS (for tests/old code)
        // ─────────────────────────────────────────

        // Old API: initializePlayers
        initializePlayers: (playerSetups: { name: string, piece: any, isStalin: boolean }[]) => {
          const state = get()

          // Clear existing players
          set({ players: [] })

          // Add each player
          playerSetups.forEach((setup) => {
            const playerId = state.addPlayer(setup.name, setup.piece)
            if (setup.isStalin) {
              state.setStalin(playerId)
            }
          })

          // Initialize properties
          state.initializeProperties?.()
        },

        // Old API: startNewGame
        startNewGame: () => {
          get().resetGame()
          get().setGamePhase('setup')
        },

        // ─────────────────────────────────────────
        // COMPATIBILITY LAYER (old API)
        // ─────────────────────────────────────────

        // Properties
        get currentPlayerIndex() { return get().currentTurnIndex },
        get roundNumber() { return get().currentRound },
        get dice() { return get().diceRoll ?? [1, 1] },

        // Stub properties
        turnPhase: 'playing' as any,
        hasRolled: false,
        isRolling: false,
        pendingAction: null,
        activeTradeOffers: [],
        gameEndCondition: null,
        showEndScreen: false,
        gameStatistics: {
          gameStartTime: new Date(),
          totalTurns: 0,
          playerStats: {},
          totalDenouncements: 0,
          totalTribunals: 0,
          totalGulagSentences: 0,
          stateTreasuryPeak: 0,
        },
        endVoteInProgress: false,
        endVoteInitiator: null,
        endVotes: {},
        confessions: [],
        greatPurgeUsed: false,
        activeGreatPurge: null,
        activeFiveYearPlan: null,
        heroesOfSovietUnion: [],
        get stalinPlayerId() {
          const stalin = get().getStalin()
          return stalin?.id ?? null
        },

        // Methods (delegate to new architecture or stub)
        setCurrentPlayer: (index: number) => {
          set({ currentTurnIndex: index })
        },

        finishRolling: () => {
          // Stub - handle dice roll completion
        },

        movePlayer: (playerId: string, spaces: number) => {
          const state = get()
          const player = state.getPlayer(playerId)
          if (!player) return

          const newPosition = (player.position + spaces) % 40
          state.setPlayerPosition(playerId, newPosition)
        },

        finishMoving: () => {
          // Stub - handle movement completion
        },

        setTurnPhase: (phase: any) => {
          // Stub - old turn phase system
        },

        setPendingAction: (action: any) => {
          set({ pendingAction: action })
        },

        addLogEntry: (entry: any) => {
          if (typeof entry === 'string') {
            get().addGameLogEntry(entry)
          } else if (entry?.message) {
            get().addGameLogEntry(entry.message)
          }
        },

        adjustTreasury: (amount: number) => {
          const current = get().stateTreasury
          if (amount > 0) {
            get().addToStateTreasury(amount)
          } else {
            get().removeFromStateTreasury(Math.abs(amount))
          }
        },

        createDebt: (debtorId: string, creditorId: string, amount: number, reason: string) => {
          // Stub - debt system not implemented in new architecture yet
        },

        submitBribe: (playerId: string, amount: number, reason: string) => {
          // Stub - bribe system not implemented in new architecture yet
        },

        answerCommunistTest: (question: any, answer: string, readerId: string) => {
          // Stub - test answering not implemented in new architecture yet
        },

        applyDirectiveEffect: (card: any, playerId: string) => {
          // Stub - directive effects not implemented in new architecture yet
        },

        ironCurtainDisappear: (playerId: string, propertyId: number) => {
          // Delegate to piece ability marker
          get().markIronCurtainDisappearUsed(playerId)
        },

        leninSpeech: (playerId: string, applauders: string[]) => {
          // Delegate to piece ability marker
          get().markLeninSpeechUsed(playerId)
        },

        submitConfession: (prisonerId: string, confession: string) => {
          // Stub - confession system not implemented in new architecture yet
        },
      }

      return store
    },
    {
      name: 'communistopoly-game',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Players
        players: state.players,

        // Properties
        properties: state.properties,

        // Game flow
        gamePhase: state.gamePhase,
        currentRound: state.currentRound,
        turnOrder: state.turnOrder,
        currentTurnIndex: state.currentTurnIndex,
        stateTreasury: state.stateTreasury,
        winner: state.winner,
        winReason: state.winReason,
        diceRoll: state.diceRoll,
        doublesCount: state.doublesCount,

        // Cards
        partyDirectiveDeck: state.partyDirectiveDeck,
        communistTestUsedQuestions: Array.from(state.communistTestUsedQuestions),

        // Log (limited)
        gameLog: state.gameLog.slice(0, 50),

        // Tribunal (if in progress)
        currentTribunal: state.currentTribunal,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.communistTestUsedQuestions)) {
          state.communistTestUsedQuestions = new Set(
            state.communistTestUsedQuestions as unknown as string[]
          )
        }
      },
    }
  )
)

// ============================================
// CONVENIENCE SELECTORS
// ============================================

export const useCurrentPlayer = () =>
  useGameStore((state) => {
    const id = state.getCurrentPlayerId()
    return id ? state.getPlayer(id) : undefined
  })

export const useActivePlayers = () =>
  useGameStore((state) => state.getActivePlayers())

export const useStalin = () =>
  useGameStore((state) => state.getStalin())

export const useGamePhase = () =>
  useGameStore((state) => state.gamePhase)
