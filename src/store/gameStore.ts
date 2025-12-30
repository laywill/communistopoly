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

// Data
import { BOARD_SPACES } from '../data/spaces'

// Services
import { createGulagService, type GulagService } from '../services/GulagService'
import { createPropertyService, type PropertyService } from '../services/PropertyService'
import { createTurnManager, type TurnManager } from '../services/TurnManager'
import { createStoyService, type StoyService } from '../services/StoyService'
import { createTribunalService, type TribunalService } from '../services/TribunalService'

// ============================================
// COMBINED STORE TYPE
// ============================================

import type { AllSlices } from './slices'
import type { SlicesStore } from '../services/types'

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
  & TribunalService
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
      // Cast to SlicesStore to provide proper typing without circular dependency
      // ─────────────────────────────────────────
      const gulagService = createGulagService(() => get() as unknown as SlicesStore)
      const propertyService = createPropertyService(() => get() as unknown as SlicesStore)
      const turnManager = createTurnManager(() => get() as unknown as SlicesStore)
      const stoyService = createStoyService(() => get() as unknown as SlicesStore)
      const tribunalService = createTribunalService(() => get() as unknown as SlicesStore)

      // ─────────────────────────────────────────
      // STEP 3: Compose complete store
      // ─────────────────────────────────────────
      const store: GameStore = {
        ...slices,
        ...gulagService,
        ...propertyService,
        ...turnManager,
        ...stoyService,
        ...tribunalService,

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
        // GAME INITIALIZATION AND SETUP
        // ─────────────────────────────────────────

        initializePlayers: (playerSetups: Array<{ name: string; piece: import('../types/game').PieceType; isStalin: boolean }>) => {
          const state = get()
          set({ players: [] })
          playerSetups.forEach((setup) => {
            const playerId = state.addPlayer(setup.name, setup.piece)
            if (setup.isStalin) {
              state.setStalin(playerId)
            }
          })
        },

        startNewGame: () => {
          get().resetGame()
          get().setGamePhase('setup')
        },

        // ─────────────────────────────────────────
        // PIECE ABILITIES
        // ─────────────────────────────────────────

        tankRequisition: (playerId: string, targetId: string) => {
          const state = get()
          const player = state.getPlayer(playerId)
          const target = state.getPlayer(targetId)
          if (player?.piece !== 'tank') return
          if (player.tankRequisitionUsedThisLap) return
          if (!target) return
          const amount = Math.min(50, target.rubles)
          state.removeMoney(targetId, amount)
          state.addMoney(playerId, amount)
          state.updatePlayer(playerId, { tankRequisitionUsedThisLap: true })
          state.addGameLogEntry(`${player.name} requisitioned ${String(amount)}₽ from ${target.name}`)
        },

        sickleHarvest: (playerId: string, propertyId: number) => {
          const state = get()
          const player = state.players.find((p) => p.id === playerId)
          const property = state.getProperty(propertyId)
          const space = BOARD_SPACES.find((s) => s.id === propertyId)
          if (player?.piece !== 'sickle') return
          if (player.hasUsedSickleHarvest) return
          if (!property || !space) return
          if (property.custodianId === null) return
          if (space.type !== 'property' || !space.baseCost || space.baseCost >= 150) return
          if (property.collectivizationLevel !== 0) return
          const victim = state.players.find((p) => p.id === property.custodianId)
          if (!victim) return
          state.setCustodian(propertyId, playerId)
          state.markSickleHarvestUsed(playerId)
          state.addGameLogEntry(`${player.name} harvested ${space.name} from ${victim.name}`)
        },

        ironCurtainDisappear: (playerId: string, propertyId: number) => {
          const state = get()
          const player = state.players.find((p) => p.id === playerId)
          const property = state.getProperty(propertyId)
          const space = BOARD_SPACES.find((s) => s.id === propertyId)
          if (player?.piece !== 'ironCurtain') return
          if (player.hasUsedIronCurtainDisappear) return
          if (!property || !space) return
          if (property.custodianId === null) return
          state.setCustodian(propertyId, null)
          state.markIronCurtainDisappearUsed(playerId)
          state.addGameLogEntry(`${player.name} used Iron Curtain to disappear ${space.name}`)
        },

        leninSpeech: (playerId: string, applauders: string[]) => {
          const state = get()
          const player = state.players.find((p) => p.id === playerId)
          if (player?.piece !== 'statueOfLenin') return
          if (player.hasUsedLeninSpeech) return
          let totalReceived = 0
          let successfulApplauders = 0
          for (const applauderId of applauders) {
            const applauder = state.players.find((p) => p.id === applauderId)
            if (!applauder) continue
            if (applauder.rubles >= 100) {
              state.removeMoney(applauderId, 100)
              state.addMoney(playerId, 100)
              totalReceived += 100
              successfulApplauders++
            }
          }
          state.markLeninSpeechUsed(playerId)
          state.addGameLogEntry(`${player.name} gave inspiring speech, received ${String(totalReceived)}₽ from ${String(successfulApplauders)} comrades`)
        },

        // ─────────────────────────────────────────
        // MOVEMENT AND POSITION
        // ─────────────────────────────────────────

        movePlayer: (playerId: string, spaces: number) => {
          const state = get()
          const player = state.getPlayer(playerId)
          if (!player) return
          const oldPosition = player.position
          const newPosition = (oldPosition + spaces) % 40
          const passedStoy = oldPosition + spaces >= 40
          if (passedStoy) {
            state.handlePassingStoy(playerId)
          }
          state.setPlayerPosition(playerId, newPosition)
          if (passedStoy && player.piece === 'tank') {
            state.updatePlayer(playerId, {
              tankRequisitionUsedThisLap: false,
              lapsCompleted: player.lapsCompleted + 1
            })
          }
        },

        handleStoyPilfer: (playerId: string, success: boolean) => {
          const state = get()
          if (success) {
            state.addMoney(playerId, 100)
            state.removeFromStateTreasury(100)
          } else {
            state.sendToGulag(playerId, 'stalinDecree', 'Caught pilfering')
          }
        },

        // ─────────────────────────────────────────
        // PENDING ACTIONS
        // ─────────────────────────────────────────

        pendingAction: null as import('../types/game').PendingAction | null,

        setPendingAction: (action: import('../types/game').PendingAction | null) => {
          set({ pendingAction: action })
        },

        // ─────────────────────────────────────────
        // RANK MANAGEMENT
        // ─────────────────────────────────────────

        demotePlayer: (playerId: string) => {
          const player = get().getPlayer(playerId)
          if (!player) return
          const ranks: import('../types/game').PartyRank[] = ['proletariat', 'partyMember', 'commissar', 'innerCircle']
          const currentIdx = ranks.indexOf(player.rank)
          if (currentIdx > 0) {
            get().setPlayerRank(playerId, ranks[currentIdx - 1])
          }
        },

        promotePlayer: (playerId: string) => {
          const player = get().getPlayer(playerId)
          if (!player) return
          const ranks: import('../types/game').PartyRank[] = ['proletariat', 'partyMember', 'commissar', 'innerCircle']
          const currentIdx = ranks.indexOf(player.rank)
          if (currentIdx < ranks.length - 1) {
            get().setPlayerRank(playerId, ranks[currentIdx + 1])
          }
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
