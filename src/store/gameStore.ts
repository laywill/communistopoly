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
type SlicesStore = AllSlices

// Compatibility interface for old API
interface CompatibilityLayer {
  // Old property names
  currentPlayerIndex: number
  roundNumber: number
  dice: [number, number]
  turnPhase: import('./slices/gameFlowSlice').GamePhase
  hasRolled: boolean
  isRolling: boolean
  pendingAction: import('../types/game').PendingAction | null
  activeTradeOffers: import('../types/game').TradeOffer[]
  gameEndCondition: import('../types/game').GameEndCondition | null
  showEndScreen: boolean
  gameStatistics: import('../types/game').GameStatistics
  endVoteInProgress: boolean
  endVoteInitiator: string | null
  endVotes: Record<string, boolean>
  confessions: import('../types/game').Confession[]
  greatPurgeUsed: boolean
  activeGreatPurge: import('../types/game').GreatPurge | null
  activeFiveYearPlan: import('../types/game').FiveYearPlan | null
  heroesOfSovietUnion: import('../types/game').HeroOfSovietUnion[]
  stalinPlayerId: string | null
  winnerId: string | null

  // Old methods
  initializePlayers: (playerSetups: { name: string, piece: import('../types/game').PieceType, isStalin: boolean }[]) => void
  startNewGame: () => void
  updatePlayer: (playerId: string, updates: Partial<import('../types/game').Player>) => void
  setCurrentPlayer: (index: number) => void
  rollDice: () => void
  finishRolling: () => void
  movePlayer: (playerId: string, spaces: number) => void
  finishMoving: () => void
  setTurnPhase: (phase: import('../types/game').TurnPhase) => void
  setPendingAction: (action: import('../types/game').PendingAction | null) => void
  addLogEntry: (entry: string | { message: string }) => void
  adjustTreasury: (amount: number) => void
  createDebt: (_debtorId: string, _creditorId: string, _amount: number, _reason: string) => void
  submitBribe: (_playerId: string, _amount: number, _reason: string) => void
  answerCommunistTest: (_question: string, _answer: string, _readerId: string) => void
  applyDirectiveEffect: (_card: string, _playerId: string) => void
  ironCurtainDisappear: (playerId: string, propertyId: number) => void
  leninSpeech: (playerId: string, _applauders: string[]) => void
  submitConfession: (_prisonerId: string, _confession: string) => void
  reviewConfession: (_confessionId: string, _approved: boolean) => void
  sickleHarvest: (playerId: string, propertyId: number) => void
  handleStoyPilfer: (playerId: string, success: boolean) => void
  demotePlayer: (playerId: string) => void
  promotePlayer: (playerId: string) => void
  proposeTrade: (_fromId: string, _toId: string, _offer: import('../types/game').TradeOffer) => void
  acceptTrade: (_tradeId: string) => void
  rejectTrade: (_tradeId: string) => void
  tankRequisition: (playerId: string, targetId: string) => void
  respondToBribe: (_bribeId: string, _accepted: boolean) => void
  initiateGreatPurge: () => void
  initiateFiveYearPlan: () => void
  grantHeroOfSovietUnion: (_playerId: string) => void
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
  & TribunalService
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
        // COMPATIBILITY SHIMS (for tests/old code)
        // ─────────────────────────────────────────

        // Old API: initializePlayers
        initializePlayers: (playerSetups: { name: string, piece: import('../types/game').PieceType, isStalin: boolean }[]) => {
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

          // Properties are already initialized in initialPropertyState
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
        turnPhase: 'playing' as import('../types/game').TurnPhase,
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
          // TODO: INTEGRATE WITH STOYSERVICE - Hammer Stoy Bonus
          // This stub moves the player but doesn't trigger Stoy events
          //
          // Implementation Requirements:
          // 1. Detect if player passes position 0 (Stoy)
          //    - oldPosition = player.position
          //    - newPosition = (oldPosition + spaces) % 40
          //    - If oldPosition + spaces >= 40, player passed Stoy
          // 2. Call StoyService.handlePassingStoy(playerId) if passing
          // 3. Update position: state.setPlayerPosition(playerId, newPosition)
          // 4. Detect lap completion for Tank requisition reset
          //    - If passed position 0, reset tankRequisitionUsedThisLap
          //
          // Tests: pieceAbilities.test.ts:34 (Hammer Stoy Bonus)
          // Related: Tank lap tracking for requisition ability
          const state = get()
          const player = state.getPlayer(playerId)
          if (!player) return

          const newPosition = (player.position + spaces) % 40
          state.setPlayerPosition(playerId, newPosition)
        },

        finishMoving: () => {
          // Stub - handle movement completion
        },

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        setTurnPhase: (_phase: import('../types/game').TurnPhase) => {
          // Stub - old turn phase system
        },

        setPendingAction: (action: import('../types/game').PendingAction | null) => {
          set({ pendingAction: action })
        },

        addLogEntry: (entry: string | { message: string }) => {
          if (typeof entry === 'string') {
            get().addGameLogEntry(entry)
          } else if (entry.message) {
            get().addGameLogEntry(entry.message)
          }
        },

        adjustTreasury: (amount: number) => {
          if (amount > 0) {
            get().addToStateTreasury(amount)
          } else {
            get().removeFromStateTreasury(Math.abs(amount))
          }
        },

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        createDebt: (_debtorId: string, _creditorId: string, _amount: number, _reason: string) => {
          // Stub - debt system not implemented in new architecture yet
        },

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        submitBribe: (_playerId: string, _amount: number, _reason: string) => {
          // Stub - bribe system not implemented in new architecture yet
        },

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        answerCommunistTest: (_question: string, _answer: string, _readerId: string) => {
          // Stub - test answering not implemented in new architecture yet
        },

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        applyDirectiveEffect: (_card: string, _playerId: string) => {
          // Stub - directive effects not implemented in new architecture yet
        },

        ironCurtainDisappear: (playerId: string, propertyId: number) => {
          const state = get()
          const player = state.players.find((p) => p.id === playerId)
          const property = state.getProperty(propertyId)
          const space = BOARD_SPACES.find((s) => s.id === propertyId)

          // 1. Validate player has Iron Curtain piece
          if (player?.piece !== 'ironCurtain') return

          // 2. Validate hasUsedIronCurtainDisappear is false (once per game)
          if (player.hasUsedIronCurtainDisappear) return

          // 3. Validate propertyId exists and has a custodian
          if (!property || !space) return
          if (property.custodianId === null) return

          // 4. Transfer property to State: setCustodian(propertyId, null)
          state.setCustodian(propertyId, null)

          // 5. Mark ability as used
          state.markIronCurtainDisappearUsed(playerId)

          // 6. Add log entry
          state.addLogEntry(`${player.name} used Iron Curtain to disappear ${space.name}`)
        },

        leninSpeech: (playerId: string, applauders: string[]) => {
          const state = get()
          const player = state.players.find((p) => p.id === playerId)

          // 1. Validate player has leninStatue piece
          if (player?.piece !== 'statueOfLenin') return

          // 2. Validate hasUsedLeninSpeech is false (once per game)
          if (player.hasUsedLeninSpeech) return

          // 3. For each applauder in applauders array
          let totalReceived = 0
          let successfulApplauders = 0

          for (const applauderId of applauders) {
            const applauder = state.players.find((p) => p.id === applauderId)
            if (!applauder) continue

            // Validate applauder has >= 100₽
            if (applauder.rubles >= 100) {
              // Transfer money: remove from applauder, add to Lenin
              state.removeMoney(applauderId, 100)
              state.addMoney(playerId, 100)
              totalReceived += 100
              successfulApplauders++
            }
          }

          // 4. Mark ability as used
          state.markLeninSpeechUsed(playerId)

          // 5. Add log entry
          state.addLogEntry(`${player.name} gave inspiring speech, received ${String(totalReceived)}₽ from ${String(successfulApplauders)} comrades`)
        },

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        submitConfession: (_prisonerId: string, _confession: string) => {
          // Stub - confession system not implemented in new architecture yet
        },

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        reviewConfession: (_confessionId: string, _approved: boolean) => {
          // Stub
        },

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        sickleHarvest: (playerId: string, _propertyId: number) => {
          // TODO: IMPLEMENT - Sickle Harvest Ability
          // Allows Sickle to steal one property worth less than 150₽
          //
          // Implementation Requirements:
          // 1. Validate player has sickle piece
          // 2. Validate hasUsedSickleHarvest is false (once per game)
          // 3. Validate propertyId exists and has a custodian (not State-owned)
          // 4. Validate property baseCost < 150₽ (check BOARD_SPACES[propertyId].baseCost)
          // 5. Validate property has no collectivization (collectivizationLevel === 0)
          // 6. Transfer property: setCustodian(propertyId, playerId)
          // 7. Mark ability as used: markSickleHarvestUsed(playerId)
          // 8. Add log entry: "${player.name} harvested ${property.name} from ${victim.name}"
          //
          // Tests: pieceAbilities.test.ts:163 (1 test)
          // Note: This is essentially property theft, limited to cheap properties
          get().markSickleHarvestUsed(playerId)
        },

        handleStoyPilfer: (playerId: string, success: boolean) => {
          const state = get()
          if (success) {
            state.addMoney(playerId, 100)
            state.removeFromStateTreasury(100)
          } else {
            // Note: sendToGulag is a service method, but this is a compatibility layer
            // In new code, use slice methods directly: setPlayerInGulag + setGulagTurns
            state.sendToGulag(playerId, 'stalinDecree', 'Caught pilfering')
          }
        },

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

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        proposeTrade: (_fromId: string, _toId: string, _offer: import('../types/game').TradeOffer) => {
          // Stub
        },

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        acceptTrade: (_tradeId: string) => {
          // Stub
        },

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        rejectTrade: (_tradeId: string) => {
          // Stub
        },

        tankRequisition: (playerId: string, targetId: string) => {
          // TODO: IMPLEMENT PROPERLY - Tank Requisition Ability
          // Currently missing: per-lap limit, partial payment handling
          //
          // Implementation Requirements:
          // 1. Validate player has tank piece
          // 2. Validate tankRequisitionUsedThisLap is false (resets each lap)
          // 3. Calculate amount to take: min(50, target.rubles)
          // 4. If target has < 50₽, only take what they have
          // 5. removeMoney(targetId, amount)
          // 6. addMoney(playerId, amount)
          // 7. Update player: { tankRequisitionUsedThisLap: true }
          // 8. Add log entry: "${tank.name} requisitioned ${amount}₽ from ${target.name}"
          //
          // Lap Reset Logic:
          // - In movePlayer/setPlayerPosition, detect when position wraps (>= 40)
          // - Reset tankRequisitionUsedThisLap to false
          // - Increment lapsCompleted
          //
          // Tests: pieceAbilities.test.ts:301, 325, 354, 380 (4 tests)
          const state = get()
          state.removeMoney(targetId, 50)
          state.addMoney(playerId, 50)
        },

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        respondToBribe: (_bribeId: string, _accepted: boolean) => {
          // Stub
        },

        initiateGreatPurge: () => {
          // Stub
        },

        initiateFiveYearPlan: () => {
          // Stub
        },

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        grantHeroOfSovietUnion: (_playerId: string) => {
          // Stub
        },

        get winnerId() {
          return get().winner
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
