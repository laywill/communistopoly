// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { GameState, Player, Property, GamePhase, TurnPhase, LogEntry, PendingAction, EliminationReason, GameEndCondition, Confession } from '../types/game'
import { BOARD_SPACES, getSpaceById } from '../data/spaces'
import { type DirectiveCard } from '../data/partyDirectiveCards'
import { getRandomQuestionByDifficulty, getRandomDifficulty, isAnswerCorrect, type TestQuestion } from '../data/communistTestQuestions'
import { createCardSlice, type CardSliceState, type CardSliceActions } from './slices/cardSlice'
import { createStatisticsSlice, type StatisticsSliceState, type StatisticsSliceActions } from './slices/statisticsSlice'
import { createGulagSlice, type GulagSliceState, type GulagSliceActions } from './slices/gulagSlice'
import { createPropertySlice, type PropertySliceState, type PropertySliceActions } from './slices/propertySlice'
import { createTribunalSlice, type TribunalSliceState, type TribunalSliceActions } from './slices/tribunalSlice'
import { TurnManager } from '../services/TurnManager'

// Helper functions
function getEliminationMessage (playerName: string, reason: EliminationReason): string {
  const messages: Record<EliminationReason, string> = {
    bankruptcy: `${playerName} has been eliminated due to bankruptcy. They have been declared an Enemy of the People.`,
    execution: `${playerName} has been executed by order of Stalin. They are now a Ghost of the Revolution.`,
    gulagTimeout: `${playerName} died in the Gulag after 10 turns. They are now a Ghost of the Revolution.`,
    redStarDemotion: `${playerName}'s Red Star has fallen to Proletariat - immediate execution! They are now a Ghost of the Revolution.`,
    unanimous: `${playerName} was unanimously voted out by all players. They are now a Ghost of the Revolution.`
  }
  return messages[reason]
}

function calculateTotalWealth (player: Player, properties: Property[]): number {
  let total = player.rubles

  // Add property values (50% of base cost for mortgaged properties)
  player.properties.forEach(propId => {
    const property = properties.find(p => p.spaceId === parseInt(propId))
    if (property != null) {
      const space = getSpaceById(property.spaceId)
      const baseValue = space?.baseCost ?? 0
      const propertyValue = property.mortgaged ? baseValue * 0.5 : baseValue
      total += propertyValue

      // Add improvement values
      total += property.collectivizationLevel * 50
    }
  })

  // Subtract debts
  if (player.debt != null) {
    total -= player.debt.amount
  }

  return total
}

interface GameActions {
  // Game phase management
  setGamePhase: (phase: GamePhase) => void
  startNewGame: () => void
  resetGame: () => void

  // Player management
  initializePlayers: (playerSetups: { name: string, piece: Player['piece'], isStalin: boolean }[]) => void
  setCurrentPlayer: (index: number) => void
  updatePlayer: (playerId: string, updates: Partial<Player>) => void

  // Property management (Note: most property actions moved to propertySlice)
  initializeProperties: () => void
  updateCollectivizationLevel: (spaceId: number, level: number) => void

  // Turn management
  rollDice: () => void
  rollVodka3Dice: () => void
  finishRolling: () => void
  movePlayer: (playerId: string, spaces: number) => void
  finishMoving: () => void
  endTurn: () => void
  setTurnPhase: (phase: TurnPhase) => void

  // Gulag management (Note: most Gulag actions moved to gulagSlice)
  demotePlayer: (playerId: string) => void

  // Trade system
  proposeTrade: (fromPlayerId: string, toPlayerId: string, items: { offering: import('../types/game').TradeItems, requesting: import('../types/game').TradeItems }) => void
  acceptTrade: (tradeId: string) => void
  rejectTrade: (tradeId: string) => void

  // Debt and liquidation
  createDebt: (debtorId: string, creditorId: string, amount: number, reason: string) => void
  checkDebtStatus: () => void

  // Elimination and ghosts
  eliminatePlayer: (playerId: string, reason: EliminationReason) => void
  checkElimination: (playerId: string) => boolean

  // Game end
  checkGameEnd: () => GameEndCondition | null
  endGame: (condition: GameEndCondition, winnerId: string | null) => void

  // Unanimous end vote
  initiateEndVote: (initiatorId: string) => void
  castEndVote: (playerId: string, vote: boolean) => void

  // Confessions
  submitConfession: (prisonerId: string, confession: string) => void
  reviewConfession: (confessionId: string, accepted: boolean) => void

  // Round management
  incrementRound: () => void

  // STOY handling
  handleStoyPassing: (playerId: string) => void
  handleStoyPilfer: (playerId: string, diceRoll: number) => void

  // Card system
  applyDirectiveEffect: (card: DirectiveCard, playerId: string) => void
  answerCommunistTest: (question: TestQuestion, answer: string, readerId: string) => void

  // Piece abilities
  tankRequisition: (tankPlayerId: string, targetPlayerId: string) => void
  sickleHarvest: (sicklePlayerId: string, targetPropertyId: number) => void
  ironCurtainDisappear: (ironCurtainPlayerId: string, targetPropertyId: number) => void
  leninSpeech: (leninPlayerId: string, applauders: string[]) => void
  promotePlayer: (playerId: string) => void

  // Property special abilities
  kgbPreviewTest: (custodianId: string) => void
  ministryTruthRewrite: (custodianId: string, newRule: string) => void
  pravdaPressRevote: (custodianId: string, decision: string) => void

  // Game log
  addLogEntry: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void

  // Treasury
  adjustTreasury: (amount: number) => void

  // Pending actions
  setPendingAction: (action: PendingAction | null) => void

  // Special Decrees
  initiateGreatPurge: () => void
  voteInGreatPurge: (voterId: string, targetId: string) => void
  resolveGreatPurge: () => void
  initiateFiveYearPlan: (target: number, durationMinutes: number) => void
  contributeToFiveYearPlan: (playerId: string, amount: number) => void
  resolveFiveYearPlan: () => void
  grantHeroOfSovietUnion: (playerId: string) => void
  isHeroOfSovietUnion: (playerId: string) => boolean
}

type GameStore = GameState & GameActions & CardSliceState & CardSliceActions & StatisticsSliceState & StatisticsSliceActions & GulagSliceState & GulagSliceActions & PropertySliceState & PropertySliceActions & TribunalSliceState & TribunalSliceActions

const initialState: GameState = {
  gamePhase: 'welcome',
  players: [],
  stalinPlayerId: null,
  currentPlayerIndex: 0,
  properties: [],
  stateTreasury: 0,
  turnPhase: 'pre-roll',
  doublesCount: 0,
  hasRolled: false,
  roundNumber: 1,
  dice: [1, 1],
  isRolling: false,
  gameLog: [],
  pendingAction: null,
  activeVouchers: [],
  pendingBribes: [],
  activeTradeOffers: [],

  // Game end tracking
  gameEndCondition: null,
  winnerId: null,
  showEndScreen: false,

  // Unanimous end vote
  endVoteInProgress: false,
  endVoteInitiator: null,
  endVotes: {},

  // Rehabilitation confessions
  confessions: [],

  // Special Decrees
  greatPurgeUsed: false,
  activeGreatPurge: null,
  activeFiveYearPlan: null,
  heroesOfSovietUnion: []
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => {
      // Create the card slice
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      const cardSlice = createCardSlice(set as any, get as any, undefined as any)

      // Create the statistics slice
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      const statisticsSlice = createStatisticsSlice(set as any, get as any, undefined as any)

      // Create the gulag slice
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      const gulagSlice = createGulagSlice(set as any, get as any, undefined as any)

      // Create the property slice
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      const propertySlice = createPropertySlice(set as any, get as any, undefined as any)

      // Create the tribunal slice
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      const tribunalSlice = createTribunalSlice(set as any, get as any, undefined as any)

      // Compose the base store from slices
      const baseStore = {
        ...initialState,
        ...cardSlice,
        ...statisticsSlice,
        ...gulagSlice,
        ...propertySlice,
        ...tribunalSlice,

        setGamePhase: (phase) => set({ gamePhase: phase }),

        startNewGame: () => set({ ...initialState, gamePhase: 'setup' }),

        // Override drawPartyDirective to maintain logging behavior
        drawPartyDirective: () => {
          const wasEmpty = get().partyDirectiveDeck.length === 0
          const card = cardSlice.drawPartyDirective()
          if (wasEmpty) {
            get().addLogEntry({
              type: 'system',
              message: 'Party Directive deck reshuffled'
            })
          }
          return card
        },

      resetGame: () => {
        // Clear localStorage save
        localStorage.removeItem('communistopoly-save')

        // Create fresh card state
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
        const freshCardSlice = createCardSlice(set as any, get as any, undefined as any)

        // Create fresh statistics state
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
        const freshStatisticsSlice = createStatisticsSlice(set as any, get as any, undefined as any)

        // Create fresh gulag state
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
        const freshGulagSlice = createGulagSlice(set as any, get as any, undefined as any)

        // Create fresh property state
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
        const freshPropertySlice = createPropertySlice(set as any, get as any, undefined as any)

        // Create fresh tribunal state
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
        const freshTribunalSlice = createTribunalSlice(set as any, get as any, undefined as any)

        // Reset all state to initial values
        set({
          ...initialState,
          ...freshCardSlice,
          ...freshStatisticsSlice,
          ...freshGulagSlice,
          ...freshPropertySlice,
          ...freshTribunalSlice,
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

        // Reset card state when starting new game
        get().resetCardState()

        // Reset statistics when starting new game
        get().resetStatistics()

        set({
          players,
          stalinPlayerId: stalinPlayer?.id ?? null,
          currentPlayerIndex: 1, // Start with first non-Stalin player
          stateTreasury
        })

        // Initialize player statistics
        players.forEach(player => {
          if (!player.isStalin) {
            get().initializePlayerStats(player.id)
          }
        })

        // Initialize properties
        get().initializeProperties()
      },

      setCurrentPlayer: (index) => set({ currentPlayerIndex: index }),

      updatePlayer: (playerId, updates) => {
        set((state) => {
          const player = state.players.find(p => p.id === playerId)

          // BREAD LOAF ABILITY: Enforce 1000₽ wealth cap
          if (player?.piece === 'breadLoaf' && updates.rubles !== undefined) {
            if (updates.rubles > 1000) {
              const excess = updates.rubles - 1000
              updates.rubles = 1000

              // Donate excess to State
              get().adjustTreasury(excess)
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

      initializeProperties: () => {
        const properties: Property[] = BOARD_SPACES
          .filter((space) => space.type === 'property' || space.type === 'railway' || space.type === 'utility')
          .map((space) => ({
            spaceId: space.id,
            custodianId: null, // All start owned by the STATE
            collectivizationLevel: 0,
            mortgaged: false
          }))

        set({ properties })
      },

      updateCollectivizationLevel: (spaceId, level) => {
        set((state) => ({
          properties: state.properties.map((prop) =>
            prop.spaceId === spaceId ? { ...prop, collectivizationLevel: level } : prop
          )
        }))
      },

      // Turn management
      rollDice: () => {
        const die1 = Math.floor(Math.random() * 6) + 1
        const die2 = Math.floor(Math.random() * 6) + 1

        set({
          dice: [die1, die2],
          isRolling: true,
          hasRolled: true,
          turnPhase: 'rolling'
        })

        const currentPlayer = get().players[get().currentPlayerIndex]
        get().addLogEntry({
          type: 'dice',
          message: `Rolled ${String(die1)} + ${String(die2)} = ${String(die1 + die2)}`,
          playerId: currentPlayer.id
        })
      },

      // VODKA BOTTLE ABILITY: Roll 3 dice, use best 2
      rollVodka3Dice: () => {
        const die1 = Math.floor(Math.random() * 6) + 1
        const die2 = Math.floor(Math.random() * 6) + 1
        const die3 = Math.floor(Math.random() * 6) + 1

        // Find best 2 dice (highest sum)
        const allDice = [die1, die2, die3].sort((a, b) => b - a)
        const bestTwo: [number, number] = [allDice[0], allDice[1]]

        set({
          dice: bestTwo,
          isRolling: true,
          hasRolled: true,
          turnPhase: 'rolling'
        })

        const currentPlayer = get().players[get().currentPlayerIndex]

        // Increment vodka use count
        get().updatePlayer(currentPlayer.id, {
          vodkaUseCount: currentPlayer.vodkaUseCount + 1
        })

        get().addLogEntry({
          type: 'dice',
          message: `${currentPlayer.name} drank and rolled 3 dice: ${String(die1)}, ${String(die2)}, ${String(die3)}. Using best 2: ${String(bestTwo[0])} + ${String(bestTwo[1])} = ${String(bestTwo[0] + bestTwo[1])}`,
          playerId: currentPlayer.id
        })
      },

      finishRolling: () => {
        const { dice, doublesCount } = get()
        const die1: number = dice[0]
        const die2: number = dice[1]
        const isDoubles = die1 === die2
        const newDoublesCount: number = isDoubles ? (doublesCount) + 1 : 0

        // Check for three doubles (counter-revolutionary behavior)
        if (newDoublesCount >= 3) {
          const currentPlayer = get().players[get().currentPlayerIndex]
          get().sendToGulag(currentPlayer.id, 'threeDoubles')
          set({ isRolling: false, doublesCount: 0 })
          return
        }

        set({
          isRolling: false,
          doublesCount: newDoublesCount,
          turnPhase: 'moving'
        })

        // Move the player
        const currentPlayer = get().players[get().currentPlayerIndex]
        const total = die1 + die2
        get().movePlayer(currentPlayer.id, total)
      },

      movePlayer: (playerId, spaces) => {
        const state = get()
        const player = state.players.find((p) => p.id === playerId)
        if (player == null) return

        const oldPosition: number = player.position
        const newPosition = (oldPosition + spaces) % 40

        // Check if player passed STOY (position 0)
        const passedStoy = oldPosition !== 0 && (oldPosition + spaces >= 40)

        // Update player position and track laps
        const updates: Partial<Player> = { position: newPosition }
        if (passedStoy) {
          updates.lapsCompleted = (player.lapsCompleted) + 1
          updates.tankRequisitionUsedThisLap = false // Reset Tank requisition for new lap
        }
        get().updatePlayer(playerId, updates)

        const fromSpace = getSpaceById(oldPosition)
        const toSpace = getSpaceById(newPosition)
        get().addLogEntry({
          type: 'movement',
          message: `${player.name} moved from ${fromSpace?.name ?? 'Unknown'} to ${toSpace?.name ?? 'Unknown'}`,
          playerId
        })

        // Handle passing STOY
        if (passedStoy && newPosition !== 0) {
          get().handleStoyPassing(playerId)
        }
      },

      finishMoving: () => {
        const state = get()
        const currentPlayer = state.players[state.currentPlayerIndex]
        const space = getSpaceById(currentPlayer.position)

        set({ turnPhase: 'resolving' })

        // Handle landing on the space
        if (space == null) return

        switch (space.type) {
          case 'corner':
            if (space.id === 0 && currentPlayer.position === 0) {
              // Landed exactly on STOY - pilfering opportunity
              set({ pendingAction: { type: 'stoy-pilfer' } })
            } else if (space.id === 10) {
              // The Gulag - just visiting
              get().addLogEntry({
                type: 'movement',
                message: `${currentPlayer.name} is just visiting the Gulag`,
                playerId: currentPlayer.id
              })
              set({ turnPhase: 'post-turn' })
            } else if (space.id === 20) {
              // Breadline - all players must contribute
              get().addLogEntry({
                type: 'system',
                message: `${currentPlayer.name} landed on Breadline - all comrades must contribute!`,
                playerId: currentPlayer.id
              })
              set({
                pendingAction: {
                  type: 'breadline-contribution',
                  data: { landingPlayerId: currentPlayer.id }
                }
              })
            } else if (space.id === 30) {
              // Enemy of the State - go to Gulag
              get().sendToGulag(currentPlayer.id, 'enemyOfState')
            }
            break

          case 'property':
          case 'railway':
          case 'utility': {
            const property = state.properties.find((p) => p.spaceId === space.id)
            if (property == null) {
              set({ turnPhase: 'post-turn' })
              break
            }

            // Check if property is owned by State (available for purchase)
            if (property.custodianId === null) {
              set({
                pendingAction: {
                  type: 'property-purchase',
                  data: { spaceId: space.id, playerId: currentPlayer.id }
                }
              })
            } else if (property.custodianId !== currentPlayer.id) {
              // Check if property is owned by another player (must pay quota)
              if (space.type === 'railway') {
                set({
                  pendingAction: {
                    type: 'railway-fee',
                    data: { spaceId: space.id, payerId: currentPlayer.id }
                  }
                })
              } else if (space.type === 'utility') {
                const die1: number = state.dice[0]
                const die2: number = state.dice[1]
                set({
                  pendingAction: {
                    type: 'utility-fee',
                    data: { spaceId: space.id, payerId: currentPlayer.id, diceTotal: die1 + die2 }
                  }
                })
              } else {
                set({
                  pendingAction: {
                    type: 'quota-payment',
                    data: { spaceId: space.id, payerId: currentPlayer.id }
                  }
                })
              }
            } else {
              // Player owns this property - just visiting
              get().addLogEntry({
                type: 'system',
                message: `${currentPlayer.name} landed on their own property: ${space.name}`,
                playerId: currentPlayer.id
              })
              set({ turnPhase: 'post-turn' })
            }
            break
          }

          case 'tax':
            set({
              pendingAction: {
                type: 'tax-payment',
                data: { spaceId: space.id, playerId: currentPlayer.id }
              }
            })
            break

          case 'card': {
            // Determine card type from space
            const cardSpace = space as { cardType?: 'party-directive' | 'communist-test' }

            if (cardSpace.cardType === 'party-directive') {
              get().addLogEntry({
                type: 'system',
                message: `${currentPlayer.name} landed on Party Directive`,
                playerId: currentPlayer.id
              })
              set({
                pendingAction: {
                  type: 'draw-party-directive',
                  data: { playerId: currentPlayer.id }
                }
              })
            } else if (cardSpace.cardType === 'communist-test') {
              get().addLogEntry({
                type: 'system',
                message: `${currentPlayer.name} landed on Communist Test`,
                playerId: currentPlayer.id
              })
              set({
                pendingAction: {
                  type: 'draw-communist-test',
                  data: { playerId: currentPlayer.id }
                }
              })
            } else {
              set({ turnPhase: 'post-turn' })
            }
            break
          }

          default:
            set({ turnPhase: 'post-turn' })
        }
      },

      setTurnPhase: (phase) => set({ turnPhase: phase }),

      setDoublesCount: (count) => set({ doublesCount: count }),

      setHasRolled: (rolled) => set({ hasRolled: rolled }),

      demotePlayer: (playerId) => {
        const state = get()
        const player = state.players.find((p) => p.id === playerId)
        if (player == null) return

        const rankOrder: Player['rank'][] = ['proletariat', 'partyMember', 'commissar', 'innerCircle']
        const currentRankIndex = rankOrder.indexOf(player.rank)

        if (currentRankIndex > 0) {
          const newRank = rankOrder[currentRankIndex - 1]
          get().updatePlayer(playerId, { rank: newRank })
          get().addLogEntry({
            type: 'rank',
            message: `${player.name} demoted to ${newRank}`,
            playerId
          })

          // RED STAR ABILITY: If demoted to Proletariat, immediate execution
          if (player.piece === 'redStar' && newRank === 'proletariat') {
            get().addLogEntry({
              type: 'system',
              message: `${player.name}'s Red Star has fallen to Proletariat - IMMEDIATE EXECUTION!`,
              playerId
            })
            get().eliminatePlayer(playerId, 'redStarDemotion')
          }
        }
      },

      // STOY handling
      handleStoyPassing: (playerId) => {
        const state = get()
        const player = state.players.find((p) => p.id === playerId)
        if (player == null) return

        // Deduct 200₽ travel tax
        get().updatePlayer(playerId, { rubles: player.rubles - 200 })
        get().adjustTreasury(200)

        get().addLogEntry({
          type: 'payment',
          message: `${player.name} paid ₽200 travel tax at STOY`,
          playerId
        })

        // HAMMER ABILITY: +50₽ bonus when passing STOY
        if (player.piece === 'hammer') {
          get().updatePlayer(playerId, { rubles: player.rubles - 200 + 50 }) // Net: -150₽
          get().addLogEntry({
            type: 'payment',
            message: `${player.name}'s Hammer earns +₽50 bonus at STOY!`,
            playerId
          })
        }
      },

      handleStoyPilfer: (playerId, diceRoll) => {
        const state = get()
        const player = state.players.find((p) => p.id === playerId)
        if (player == null) return

        if (diceRoll >= 4) {
          // Success! Steal 100₽ from State
          const newRubles: number = player.rubles + 100
          get().updatePlayer(playerId, { rubles: newRubles })
          get().adjustTreasury(-100)

          get().addLogEntry({
            type: 'payment',
            message: `${player.name} successfully pilfered ₽100 from the State Treasury!`,
            playerId
          })
        } else {
          // Caught! Go to Gulag
          get().sendToGulag(playerId, 'pilferingCaught')
        }

        set({ pendingAction: null, turnPhase: 'post-turn' })
      },

      // Piece abilities
      tankRequisition: (tankPlayerId, targetPlayerId) => {
        const state = get()
        const tankPlayer = state.players.find((p) => p.id === tankPlayerId)
        const targetPlayer = state.players.find((p) => p.id === targetPlayerId)

        if (tankPlayer == null || targetPlayer == null) return
        if (tankPlayer.piece !== 'tank') return
        if (tankPlayer.tankRequisitionUsedThisLap) return

        // Requisition ₽50 from target (or all their money if they have less)
        const requisitionAmount = Math.min(50, targetPlayer.rubles)

        get().updatePlayer(targetPlayerId, { rubles: targetPlayer.rubles - requisitionAmount })
        get().updatePlayer(tankPlayerId, {
          rubles: tankPlayer.rubles + requisitionAmount,
          tankRequisitionUsedThisLap: true
        })

        get().addLogEntry({
          type: 'payment',
          message: `${tankPlayer.name}'s Tank requisitioned ₽${String(requisitionAmount)} from ${targetPlayer.name}!`,
          playerId: tankPlayerId
        })
      },

      // Game log
      addLogEntry: (entry) => {
        const newEntry: LogEntry = {
          ...entry,
          id: `log-${String(Date.now())}-${String(Math.random())}`,
          timestamp: new Date()
        }

        set((state) => ({
          gameLog: [...state.gameLog, newEntry].slice(-50) // Keep last 50 entries
        }))
      },

      // Treasury
      adjustTreasury: (amount) => {
        set((state) => ({
          stateTreasury: Math.max(0, (state.stateTreasury) + (amount))
        }))
      },

      // Pending actions
      setPendingAction: (action) => {
        set({ pendingAction: action })
      },

      // Trade system
      proposeTrade: (fromPlayerId, toPlayerId, items) => {
        const state = get()
        const fromPlayer = state.players.find((p) => p.id === fromPlayerId)
        const toPlayer = state.players.find((p) => p.id === toPlayerId)

        if ((fromPlayer == null) || (toPlayer == null)) return

        const tradeOffer: import('../types/game').TradeOffer = {
          id: `trade-${String(Date.now())}`,
          fromPlayerId,
          toPlayerId,
          offering: items.offering,
          requesting: items.requesting,
          status: 'pending',
          timestamp: new Date()
        }

        set((state) => ({
          activeTradeOffers: [...state.activeTradeOffers, tradeOffer]
        }))

        get().addLogEntry({
          type: 'system',
          message: `${fromPlayer.name} proposed a trade to ${toPlayer.name}`,
          playerId: fromPlayerId
        })

        // Show trade response modal to the receiving player
        get().setPendingAction({
          type: 'trade-response',
          data: { tradeOfferId: tradeOffer.id }
        })
      },

      acceptTrade: (tradeId) => {
        const state = get()
        const trade = state.activeTradeOffers.find((t) => t.id === tradeId)
        if (trade == null) return

        const fromPlayer = state.players.find((p) => p.id === trade.fromPlayerId)
        const toPlayer = state.players.find((p) => p.id === trade.toPlayerId)
        if ((fromPlayer == null) || (toPlayer == null)) return

        // Transfer offering from fromPlayer to toPlayer
        if (trade.offering.rubles > 0) {
          get().updatePlayer(fromPlayer.id, { rubles: fromPlayer.rubles - trade.offering.rubles })
          get().updatePlayer(toPlayer.id, { rubles: toPlayer.rubles + trade.offering.rubles })
        }

        trade.offering.properties.forEach((propId) => {
          get().transferProperty(propId, toPlayer.id)
        })

        if (trade.offering.gulagCards > 0 && fromPlayer.hasFreeFromGulagCard) {
          get().updatePlayer(fromPlayer.id, { hasFreeFromGulagCard: false })
          get().updatePlayer(toPlayer.id, { hasFreeFromGulagCard: true })
        }

        if (trade.offering.favours > 0) {
          const updatedFavours = fromPlayer.owesFavourTo.filter((id, index) =>
            !(id === toPlayer.id && index < trade.offering.favours)
          )
          get().updatePlayer(fromPlayer.id, { owesFavourTo: updatedFavours })
        }

        // Transfer requesting from toPlayer to fromPlayer
        if (trade.requesting.rubles > 0) {
          get().updatePlayer(toPlayer.id, { rubles: toPlayer.rubles - trade.requesting.rubles })
          get().updatePlayer(fromPlayer.id, { rubles: fromPlayer.rubles + trade.requesting.rubles })
        }

        trade.requesting.properties.forEach((propId) => {
          get().transferProperty(propId, fromPlayer.id)
        })

        if (trade.requesting.gulagCards > 0 && toPlayer.hasFreeFromGulagCard) {
          get().updatePlayer(toPlayer.id, { hasFreeFromGulagCard: false })
          get().updatePlayer(fromPlayer.id, { hasFreeFromGulagCard: true })
        }

        if (trade.requesting.favours > 0) {
          const updatedFavours = toPlayer.owesFavourTo.filter((id, index) =>
            !(id === fromPlayer.id && index < trade.requesting.favours)
          )
          get().updatePlayer(toPlayer.id, { owesFavourTo: updatedFavours })
        }

        // Mark trade as accepted and remove
        set((state) => ({
          activeTradeOffers: state.activeTradeOffers.filter((t) => t.id !== tradeId)
        }))

        get().addLogEntry({
          type: 'property',
          message: `${toPlayer.name} accepted trade from ${fromPlayer.name}`,
          playerId: toPlayer.id
        })
      },

      rejectTrade: (tradeId) => {
        const state = get()
        const trade = state.activeTradeOffers.find((t) => t.id === tradeId)
        if (trade == null) return

        const fromPlayer = state.players.find((p) => p.id === trade.fromPlayerId)
        const toPlayer = state.players.find((p) => p.id === trade.toPlayerId)

        // Mark trade as rejected and remove
        set((state) => ({
          activeTradeOffers: state.activeTradeOffers.filter((t) => t.id !== tradeId)
        }))

        if ((fromPlayer != null) && (toPlayer != null)) {
          get().addLogEntry({
            type: 'system',
            message: `${toPlayer.name} rejected trade from ${fromPlayer.name}`,
            playerId: toPlayer.id
          })
        }
      },

      createDebt: (debtorId, creditorId, amount, reason) => {
        const state = get()
        const debtor = state.players.find((p) => p.id === debtorId)
        if (debtor == null) return

        const debt = {
          id: `debt-${String(Date.now())}`,
          debtorId,
          creditorId,
          amount,
          createdAtRound: state.roundNumber,
          reason
        }

        get().updatePlayer(debtorId, {
          debt,
          debtCreatedAtRound: state.roundNumber
        })

        const creditorName = creditorId === 'state' ? 'the State' : state.players.find((p) => p.id === creditorId)?.name ?? 'Unknown'
        get().addLogEntry({
          type: 'payment',
          message: `${debtor.name} owes ₽${String(amount)} to ${creditorName} - ${reason}. Must pay within one round or face Gulag!`,
          playerId: debtorId
        })
      },

      checkDebtStatus: () => {
        const state = get()

        state.players.forEach((player) => {
          if (player.debt != null && player.debtCreatedAtRound !== null) {
            // Check if one full round has passed
            if ((state.roundNumber) > (player.debtCreatedAtRound) + 1) {
              // Debt default! Send to Gulag
              get().sendToGulag(player.id, 'debtDefault')

              // Clear debt
              get().updatePlayer(player.id, {
                debt: null,
                debtCreatedAtRound: null
              })
            }
          }
        })
      },

      eliminatePlayer: (playerId, reason) => {
        const state = get()
        const player = state.players.find((p) => p.id === playerId)
        if (player == null) return

        // Return all properties to State (with improvements removed)
        player.properties.forEach((propId) => {
          get().setPropertyCustodian(parseInt(propId), null)
          get().updateCollectivizationLevel(parseInt(propId), 0)
        })

        // Update player with elimination details
        get().updatePlayer(playerId, {
          isEliminated: true,
          inGulag: false,
          properties: [],
          eliminationReason: reason,
          eliminationTurn: state.roundNumber,
          finalWealth: player.rubles,
          finalRank: player.rank,
          finalProperties: player.properties.length
        })

        // Log elimination with proper message
        const message = getEliminationMessage(player.name, reason)
        get().addLogEntry({
          type: 'system',
          message,
          playerId
        })

        // Check if game should end
        get().checkGameEnd()
      },

      checkElimination: (playerId) => {
        const state = get()
        const player = state.players.find(p => p.id === playerId)
        if ((player == null) || player.isEliminated || player.isStalin) return false

        // Bankruptcy check
        const totalWealth = calculateTotalWealth(player, state.properties)
        if (totalWealth < 0 && (player.debt != null)) {
          get().eliminatePlayer(playerId, 'bankruptcy')
          return true
        }

        // Red Star specific - already checked in demotePlayer

        // Gulag timeout - already checked in checkFor10TurnElimination

        return false
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

      submitConfession: (prisonerId, confession) => {
        const state = get()
        const prisoner = state.players.find(p => p.id === prisonerId)
        if (!prisoner?.inGulag) return

        const newConfession: Confession = {
          id: `confession-${String(Date.now())}`,
          prisonerId,
          confession,
          timestamp: new Date(),
          reviewed: false
        }

        set((state) => ({
          confessions: [...state.confessions, newConfession]
        }))

        get().addLogEntry({
          type: 'gulag',
          message: `${prisoner.name} has submitted a rehabilitation confession to Stalin`,
          playerId: prisonerId
        })

        // Notify Stalin (set pending action for Stalin to review)
        set({
          pendingAction: {
            type: 'review-confession',
            data: { confessionId: newConfession.id }
          }
        })
      },

      reviewConfession: (confessionId, accepted) => {
        const state = get()
        const confession = state.confessions.find(c => c.id === confessionId)
        if ((confession == null) || confession.reviewed) return

        const prisoner = state.players.find(p => p.id === confession.prisonerId)
        if (prisoner == null) return

        // Mark confession as reviewed
        set((state) => ({
          confessions: state.confessions.map(c =>
            c.id === confessionId ? { ...c, reviewed: true, accepted } : c
          )
        }))

        if (accepted) {
          // Release from Gulag
          get().updatePlayer(confession.prisonerId, {
            inGulag: false,
            gulagTurns: 0
          })

          get().addLogEntry({
            type: 'gulag',
            message: `Stalin accepted ${prisoner.name}'s rehabilitation confession and released them from the Gulag!`,
            playerId: confession.prisonerId
          })
        } else {
          get().addLogEntry({
            type: 'gulag',
            message: `Stalin rejected ${prisoner.name}'s rehabilitation confession. They remain in the Gulag.`,
            playerId: confession.prisonerId
          })
        }

        set({ pendingAction: null })
      },

      // Card system
      applyDirectiveEffect: (card, playerId) => {
        const state = get()
        const player = state.players.find(p => p.id === playerId)
        if (player == null) return

        get().addLogEntry({
          type: 'system',
          message: `${player.name} drew: ${card.title} - ${card.description}`
        })

        switch (card.effect.type) {
          case 'move':
            if (card.effect.destination !== undefined) {
              get().updatePlayer(playerId, { position: card.effect.destination })
              // Check if passed STOY
              if (player.position < card.effect.destination && card.effect.destination !== 0) {
                get().handleStoyPassing(playerId)
              }
            }
            break

          case 'moveRelative':
            if (card.effect.spaces !== undefined) {
              get().movePlayer(playerId, card.effect.spaces)
            }
            break

          case 'money':
            if (card.effect.amount !== undefined) {
              get().updatePlayer(playerId, { rubles: player.rubles + card.effect.amount })
              if (card.effect.amount > 0) {
                get().adjustTreasury(-card.effect.amount)
              } else {
                get().adjustTreasury(Math.abs(card.effect.amount))
              }
            }
            break

          case 'gulag':
            get().sendToGulag(playerId, 'stalinDecree', 'Party Directive card')
            break

          case 'freeFromGulag':
            get().updatePlayer(playerId, { hasFreeFromGulagCard: true })
            get().addLogEntry({
              type: 'system',
              message: `${player.name} received a "Get out of Gulag free" card!`,
              playerId
            })
            break

          case 'rankChange':
            if (card.effect.direction === 'up') {
              get().promotePlayer(playerId)
            } else {
              get().demotePlayer(playerId)
            }
            break

          case 'collectFromAll':
            if (card.effect.amount !== undefined) {
              const effectAmount = card.effect.amount
              state.players.forEach(p => {
                if (!p.isStalin && p.id !== playerId && !p.isEliminated) {
                  const amount = Math.min(effectAmount, p.rubles)
                  get().updatePlayer(p.id, { rubles: p.rubles - amount })
                  get().updatePlayer(playerId, { rubles: player.rubles + amount })
                }
              })
            }
            break

          case 'payToAll':
            if (card.effect.amount !== undefined) {
              const effectAmount = card.effect.amount
              state.players.forEach(p => {
                if (!p.isStalin && p.id !== playerId && !p.isEliminated) {
                  const amount = Math.min(effectAmount, player.rubles)
                  get().updatePlayer(playerId, { rubles: player.rubles - amount })
                  get().updatePlayer(p.id, { rubles: p.rubles + amount })
                }
              })
            }
            break

          case 'propertyTax': {
            const properties = state.properties.filter(p => p.custodianId === playerId)
            let totalTax = 0
            if (card.effect.perProperty) {
              totalTax += properties.length * card.effect.perProperty
            }
            if (card.effect.perImprovement) {
              const totalImprovements = properties.reduce((sum, p) => sum + p.collectivizationLevel, 0)
              totalTax += totalImprovements * card.effect.perImprovement
            }
            get().updatePlayer(playerId, { rubles: player.rubles - totalTax })
            get().adjustTreasury(totalTax)
            get().addLogEntry({
              type: 'payment',
              message: `${player.name} paid ₽${String(totalTax)} in property taxes`,
              playerId
            })
            break
          }

          case 'custom':
            // Handle custom effects in modal
            get().addLogEntry({
              type: 'system',
              message: `Custom effect: ${card.effect.handler ?? 'unknown'} - requires special handling`,
              playerId
            })
            break
        }

        set({ pendingAction: null, turnPhase: 'post-turn' })
      },

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      answerCommunistTest: (question, answer, _readerId) => {
        const state = get()
        const currentPlayer = state.players[state.currentPlayerIndex]

        // Check if Vodka Bottle is immune to trick questions
        const isCorrect = isAnswerCorrect(question, answer)

        if (question.difficulty === 'trick' && currentPlayer.piece === 'vodkaBottle') {
          get().addLogEntry({
            type: 'system',
            message: `${currentPlayer.name}'s Vodka Bottle makes them immune to trick questions!`,
            playerId: currentPlayer.id
          })
          set({ pendingAction: null, turnPhase: 'post-turn' })
          return
        }

        if (isCorrect) {
          // Correct answer
          get().updatePlayer(currentPlayer.id, {
            correctTestAnswers: currentPlayer.correctTestAnswers + 1,
            consecutiveFailedTests: 0
          })

          // Apply reward (doubled for Red Star penalty)
          const reward = currentPlayer.piece === 'redStar' ? question.reward * 2 : question.reward
          if (reward > 0) {
            get().updatePlayer(currentPlayer.id, { rubles: currentPlayer.rubles + reward })
            get().adjustTreasury(-reward)
          }

          // Hard questions grant rank up
          if (question.grantsRankUp) {
            get().promotePlayer(currentPlayer.id)
          }

          // Check for Party Member eligibility (2 correct answers)
          if (currentPlayer.correctTestAnswers >= 2 && currentPlayer.rank === 'proletariat') {
            get().promotePlayer(currentPlayer.id)
          }

          get().addLogEntry({
            type: 'system',
            message: `${currentPlayer.name} answered correctly! Reward: ₽${String(reward)}`,
            playerId: currentPlayer.id
          })
        } else {
          // Wrong answer
          get().updatePlayer(currentPlayer.id, {
            consecutiveFailedTests: currentPlayer.consecutiveFailedTests + 1
          })

          // Apply penalty (doubled for Red Star)
          const penalty = currentPlayer.piece === 'redStar' ? question.penalty * 2 : question.penalty
          if (penalty > 0) {
            get().updatePlayer(currentPlayer.id, { rubles: currentPlayer.rubles - penalty })
            get().adjustTreasury(penalty)
          }

          // 2 consecutive failures = rank loss
          if (currentPlayer.consecutiveFailedTests >= 2) {
            get().demotePlayer(currentPlayer.id)
            get().updatePlayer(currentPlayer.id, { consecutiveFailedTests: 0 })
          }

          get().addLogEntry({
            type: 'system',
            message: `${currentPlayer.name} answered incorrectly. Penalty: ₽${String(penalty)}`,
            playerId: currentPlayer.id
          })
        }

        set({ pendingAction: null, turnPhase: 'post-turn' })
      },

      // Piece abilities
      sickleHarvest: (sicklePlayerId, targetPropertyId) => {
        const state = get()
        const sicklePlayer = state.players.find(p => p.id === sicklePlayerId)
        const property = state.properties.find(p => p.spaceId === targetPropertyId)
        const space = getSpaceById(targetPropertyId)

        if ((sicklePlayer == null) || (property == null) || (space == null)) return
        if (sicklePlayer.piece !== 'sickle') return
        if (sicklePlayer.hasUsedSickleHarvest) return

        // Check property value < ₽150
        if ((space.baseCost ?? 0) >= 150) {
          get().addLogEntry({
            type: 'system',
            message: `Cannot harvest ${space.name} - value must be less than ₽150!`,
            playerId: sicklePlayerId
          })
          return
        }

        // Transfer property
        const oldCustodian = state.players.find(p => p.id === property.custodianId)
        get().setPropertyCustodian(targetPropertyId, sicklePlayerId)

        get().updatePlayer(sicklePlayerId, { hasUsedSickleHarvest: true })

        get().addLogEntry({
          type: 'property',
          message: `${sicklePlayer.name}'s Sickle harvested ${space.name} from ${oldCustodian?.name ?? 'the State'}!`,
          playerId: sicklePlayerId
        })

        set({ pendingAction: null })
      },

      ironCurtainDisappear: (ironCurtainPlayerId, targetPropertyId) => {
        const state = get()
        const ironCurtainPlayer = state.players.find(p => p.id === ironCurtainPlayerId)
        const property = state.properties.find(p => p.spaceId === targetPropertyId)
        const space = getSpaceById(targetPropertyId)

        if ((ironCurtainPlayer == null) || (property == null) || (space == null)) return
        if (ironCurtainPlayer.piece !== 'ironCurtain') return
        if (ironCurtainPlayer.hasUsedIronCurtainDisappear) return

        const victimPlayer = state.players.find(p => p.id === property.custodianId)

        // Return property to State
        get().setPropertyCustodian(targetPropertyId, null)

        get().updatePlayer(ironCurtainPlayer.id, { hasUsedIronCurtainDisappear: true })

        get().addLogEntry({
          type: 'property',
          message: `${ironCurtainPlayer.name}'s Iron Curtain made ${space.name} disappear from ${victimPlayer?.name ?? 'the State'}!`,
          playerId: ironCurtainPlayer.id
        })

        set({ pendingAction: null })
      },

      leninSpeech: (leninPlayerId, applauders) => {
        const state = get()
        const leninPlayer = state.players.find(p => p.id === leninPlayerId)

        if (leninPlayer == null) return
        if (leninPlayer.piece !== 'statueOfLenin') return
        if (leninPlayer.hasUsedLeninSpeech) return

        // Collect ₽100 from each applauder
        let totalCollected = 0
        applauders.forEach(applauderId => {
          const applauder = state.players.find(p => p.id === applauderId)
          if ((applauder != null) && !applauder.isEliminated) {
            const amount = Math.min(100, applauder.rubles)
            get().updatePlayer(applauderId, { rubles: applauder.rubles - amount })
            totalCollected += amount
          }
        })

        get().updatePlayer(leninPlayerId, {
          rubles: leninPlayer.rubles + totalCollected,
          hasUsedLeninSpeech: true
        })

        get().addLogEntry({
          type: 'payment',
          message: `${leninPlayer.name}'s inspiring speech collected ₽${String(totalCollected)} from ${String(applauders.length)} applauders!`,
          playerId: leninPlayerId
        })

        set({ pendingAction: null })
      },

      promotePlayer: (playerId) => {
        const state = get()
        const player = state.players.find(p => p.id === playerId)
        if (player == null) return

        const rankOrder: Player['rank'][] = ['proletariat', 'partyMember', 'commissar', 'innerCircle']
        const currentRankIndex = rankOrder.indexOf(player.rank)

        if (currentRankIndex < rankOrder.length - 1) {
          const newRank = rankOrder[currentRankIndex + 1]
          get().updatePlayer(playerId, { rank: newRank })
          get().addLogEntry({
            type: 'rank',
            message: `${player.name} promoted to ${newRank}!`,
            playerId
          })
        } else {
          get().addLogEntry({
            type: 'system',
            message: `${player.name} is already at the highest rank (Inner Circle)`,
            playerId
          })
        }
      },

      // Property special abilities
      kgbPreviewTest: (custodianId) => {
        const state = get()
        const custodian = state.players.find(p => p.id === custodianId)

        if (custodian == null) return

        // Check if custodian owns KGB Headquarters (space 23)
        const ownsKGB = state.properties.find(p => p.spaceId === 23 && p.custodianId === custodianId)

        if (ownsKGB == null) {
          get().addLogEntry({
            type: 'system',
            message: `${custodian.name} must control KGB Headquarters to use this ability!`
          })
          return
        }

        // Check if already used this round
        if (custodian.kgbTestPreviewsUsedThisRound >= 1) {
          get().addLogEntry({
            type: 'system',
            message: `${custodian.name} has already used KGB Preview this round!`
          })
          return
        }

        // Draw a random question to preview
        const difficulty = getRandomDifficulty()
        const question = getRandomQuestionByDifficulty(difficulty)

        // Show the question to the custodian
        alert(
          'KGB HEADQUARTERS - TEST PREVIEW\n\n' +
          `Difficulty: ${difficulty.toUpperCase()}\n` +
          `Question: ${question.question}\n\n` +
          `Answer: ${question.answer}\n\n` +
          'This preview has been noted by the KGB.'
        )

        get().updatePlayer(custodianId, {
          kgbTestPreviewsUsedThisRound: custodian.kgbTestPreviewsUsedThisRound + 1
        })

        get().addLogEntry({
          type: 'system',
          message: `${custodian.name} used KGB Headquarters to preview a Communist Test question`,
          playerId: custodianId
        })
      },

      ministryTruthRewrite: (custodianId, newRule) => {
        const state = get()
        const custodian = state.players.find(p => p.id === custodianId)

        if (custodian == null) return
        if (custodian.hasUsedMinistryTruthRewrite) return

        // Check if custodian owns all three Ministry properties (16, 18, 19)
        const ownsMinistries = [16, 18, 19].every(spaceId =>
          state.properties.find(p => p.spaceId === spaceId && p.custodianId === custodianId)
        )

        if (!ownsMinistries) {
          get().addLogEntry({
            type: 'system',
            message: `${custodian.name} must control all three Government Ministries to use this ability!`
          })
          return
        }

        // Ask Stalin for approval
        const approved = window.confirm(
          `STALIN'S VETO POWER\n\n${custodian.name} wants to rewrite a rule:\n\n"${newRule}"\n\nDo you approve this rule change?`
        )

        if (approved) {
          get().updatePlayer(custodianId, { hasUsedMinistryTruthRewrite: true })

          get().addLogEntry({
            type: 'system',
            message: `${custodian.name} used Ministry of Truth to rewrite a rule: "${newRule}"`,
            playerId: custodianId
          })
        } else {
          get().addLogEntry({
            type: 'system',
            message: `Stalin vetoed ${custodian.name}'s rule rewrite attempt`
          })
        }

        set({ pendingAction: null })
      },

      pravdaPressRevote: (custodianId, decision) => {
        const state = get()
        const custodian = state.players.find(p => p.id === custodianId)

        if (custodian == null) return
        if (custodian.hasUsedPravdaPressRevote) return

        // Check if custodian owns all three State Media properties (26, 27, 29)
        const ownsMedia = [26, 27, 29].every(spaceId =>
          state.properties.find(p => p.spaceId === spaceId && p.custodianId === custodianId)
        )

        if (!ownsMedia) {
          get().addLogEntry({
            type: 'system',
            message: `${custodian.name} must control all three State Media properties to use this ability!`
          })
          return
        }

        get().updatePlayer(custodianId, { hasUsedPravdaPressRevote: true })

        get().addLogEntry({
          type: 'system',
          message: `${custodian.name} used Pravda Press to force a re-vote on: "${decision}" - The people demand it!`,
          playerId: custodianId
        })

        alert(
          'PRAVDA PRESS - PROPAGANDA SPREAD\n\n' +
          `${custodian.name} demands a re-vote on:\n"${decision}"\n\n` +
          'THE PEOPLE DEMAND IT!'
        )

        set({ pendingAction: null })
      },

      // Special Decrees
      initiateGreatPurge: () => {
        const state = get()

        if (state.greatPurgeUsed) {
          get().addLogEntry({
            type: 'system',
            message: 'The Great Purge has already been used this game!'
          })
          return
        }

        set({
          greatPurgeUsed: true,
          activeGreatPurge: {
            isActive: true,
            votes: {},
            timestamp: new Date()
          }
        })

        get().addLogEntry({
          type: 'system',
          message: '☭ THE GREAT PURGE HAS BEGUN! All players must simultaneously vote by pointing at another player.'
        })
      },

      voteInGreatPurge: (voterId, targetId) => {
        const state = get()
        if (!state.activeGreatPurge?.isActive) return

        set({
          activeGreatPurge: {
            ...state.activeGreatPurge,
            votes: {
              ...state.activeGreatPurge.votes,
              [voterId]: targetId
            }
          }
        })
      },

      resolveGreatPurge: () => {
        const state = get()
        if (state.activeGreatPurge == null) return

        // Count votes
        const voteCounts: Record<string, number> = {}
        Object.values(state.activeGreatPurge.votes).forEach(targetId => {
          voteCounts[targetId] = (voteCounts[targetId] ?? 0) + 1
        })

        // Find max votes
        const maxVotes = Math.max(...Object.values(voteCounts))
        const targets = Object.entries(voteCounts)
          .filter(([, count]) => count === maxVotes)
          .map(([playerId]) => playerId)

        // Send all targets to Gulag
        targets.forEach(playerId => {
          const player = state.players.find(p => p.id === playerId)
          if (player != null && !player.inGulag) {
            get().sendToGulag(playerId, 'denouncementGuilty')
          }
        })

        const targetNames = targets.map(id => state.players.find(p => p.id === id)?.name).join(' and ')
        get().addLogEntry({
          type: 'system',
          message: `The Great Purge is complete. ${targetNames} received the most votes (${String(maxVotes)}) and have been sent to the Gulag!`
        })

        set({ activeGreatPurge: null })
      },

      initiateFiveYearPlan: (target, durationMinutes) => {
        const deadline = new Date(Date.now() + durationMinutes * 60 * 1000)

        set({
          activeFiveYearPlan: {
            isActive: true,
            target,
            collected: 0,
            deadline,
            startTime: new Date()
          }
        })

        get().addLogEntry({
          type: 'system',
          message: `☭ FIVE-YEAR PLAN INITIATED! The State requires ₽${String(target)} from the collective within ${String(durationMinutes)} minutes.`
        })
      },

      contributeToFiveYearPlan: (playerId, amount) => {
        const state = get()
        if (!state.activeFiveYearPlan?.isActive) return

        const player = state.players.find(p => p.id === playerId)
        if (player == null || player.rubles < amount) return

        // Deduct from player
        get().updatePlayer(playerId, {
          rubles: player.rubles - amount
        })

        // Add to State Treasury
        get().adjustTreasury(amount)

        // Update plan collected
        set({
          activeFiveYearPlan: {
            ...state.activeFiveYearPlan,
            collected: state.activeFiveYearPlan.collected + amount
          }
        })

        get().addLogEntry({
          type: 'system',
          message: `${player.name} contributed ₽${String(amount)} to the Five-Year Plan (${String(state.activeFiveYearPlan.collected + amount)}/₽${String(state.activeFiveYearPlan.target)})`
        })
      },

      resolveFiveYearPlan: () => {
        const state = get()
        if (state.activeFiveYearPlan == null) return

        const plan = state.activeFiveYearPlan
        const success = plan.collected >= plan.target

        if (success) {
          // Give bonus to all players
          state.players.filter(p => !p.isStalin && !p.isEliminated).forEach(player => {
            get().updatePlayer(player.id, {
              rubles: player.rubles + 100
            })
          })

          get().addLogEntry({
            type: 'system',
            message: 'Five-Year Plan SUCCESSFUL! All players receive ₽100 bonus for meeting the quota.'
          })
        } else {
          // Find poorest player and send to Gulag
          const poorestPlayer = state.players
            .filter(p => !p.isStalin && !p.isEliminated && !p.inGulag)
            .sort((a, b) => a.rubles - b.rubles)[0]

          get().sendToGulag(poorestPlayer.id, 'denouncementGuilty')
          get().addLogEntry({
            type: 'system',
            message: `Five-Year Plan FAILED! ${poorestPlayer.name} (poorest player) has been sent to the Gulag for sabotage.`
          })
        }

        set({ activeFiveYearPlan: null })
      },

      grantHeroOfSovietUnion: (playerId) => {
        const state = get()
        const player = state.players.find(p => p.id === playerId)

        if (player == null) return

        // Check if player is already a Hero
        const existingHero = state.heroesOfSovietUnion.find(h => h.playerId === playerId && h.expiresAtRound > state.roundNumber)
        if (existingHero != null) {
          get().addLogEntry({
            type: 'system',
            message: `${player.name} is already a Hero of the Soviet Union!`
          })
          return
        }

        const hero: import('../types/game').HeroOfSovietUnion = {
          playerId,
          grantedAtRound: state.roundNumber,
          expiresAtRound: state.roundNumber + 3
        }

        set({
          heroesOfSovietUnion: [...state.heroesOfSovietUnion, hero]
        })

        get().addLogEntry({
          type: 'rank',
          message: `⭐ ${player.name} has been declared a HERO OF THE SOVIET UNION! Immune to all negative effects for 3 rounds.`
        })
      },

      isHeroOfSovietUnion: (playerId) => {
        const state = get()
        return state.heroesOfSovietUnion.some(
          h => h.playerId === playerId && h.expiresAtRound > state.roundNumber
        )
      },

      incrementRound: () => {
        const state = get()
        const newRound: number = (state.roundNumber) + 1
        set({ roundNumber: newRound })

        // Clear denouncements from last round
        set({ denouncementsThisRound: [] })

        // Reset KGB test preview counter for all players
        state.players.forEach(player => {
          if (player.kgbTestPreviewsUsedThisRound > 0) {
            get().updatePlayer(player.id, { kgbTestPreviewsUsedThisRound: 0 })
          }
        })

        // Expire vouchers
        get().expireVouchers()

        // Check debt status
        get().checkDebtStatus()

        get().addLogEntry({
          type: 'system',
          message: `Round ${String(newRound)} begins`
        })
      }
      }

      // Create services after store is composed (eliminates circular dependencies)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const turnManager = new TurnManager(baseStore as any as GameState)

      // Return store with service methods
      return {
        ...baseStore,

        // Coordinated actions delegate to services
        endTurn: () => { turnManager.endTurn(); }
      }
    },
    {
      name: 'communistopoly-save',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name)
          if (!str) return null
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const parsed = JSON.parse(str)

          // Convert communistTestUsedQuestions array back to Set
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          if (parsed.state?.communistTestUsedQuestions) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            const existing = parsed.state.communistTestUsedQuestions
            if (Array.isArray(existing)) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              parsed.state.communistTestUsedQuestions = new Set(existing)
            } else if (typeof existing === 'object' && !(existing instanceof Set)) {
              // Old format - empty object, create empty Set
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              parsed.state.communistTestUsedQuestions = new Set()
            }
          }
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return parsed
        },
        setItem: (name, value) => {
          const cloned = { ...value }
          // Convert Set to Array for serialization
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (cloned.state && cloned.state.communistTestUsedQuestions instanceof Set) {
            cloned.state.communistTestUsedQuestions = Array.from(
              cloned.state.communistTestUsedQuestions
            ) as unknown as Set<string>
          }
          localStorage.setItem(name, JSON.stringify(cloned))
        },
        removeItem: (name) => {
          localStorage.removeItem(name)
        }
      },
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
        isRolling: state.isRolling,
        gameLog: state.gameLog,
        pendingAction: state.pendingAction,
        activeVouchers: state.activeVouchers,
        pendingBribes: state.pendingBribes,
        activeTradeOffers: state.activeTradeOffers,
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
      }) as GameStore
    }
  )
)
