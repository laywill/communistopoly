// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { GameState, Player, Property, GamePhase, TurnPhase, LogEntry, PendingAction, GulagReason, VoucherAgreement, BribeRequest, GulagEscapeMethod, EliminationReason, GameEndCondition, PlayerStatistics, Confession } from '../types/game'
import { BOARD_SPACES, getSpaceById } from '../data/spaces'
import { PARTY_DIRECTIVE_CARDS, shuffleDirectiveDeck, type DirectiveCard } from '../data/partyDirectiveCards'
import { getRandomQuestionByDifficulty, getRandomDifficulty, isAnswerCorrect, type TestQuestion, COMMUNIST_TEST_QUESTIONS_BY_DIFFICULTY } from '../data/communistTestQuestions'

// Helper functions
function getGulagReasonText (reason: GulagReason, justification?: string): string {
  const reasonTexts: Record<GulagReason, string> = {
    enemyOfState: 'Landed on Enemy of the State',
    threeDoubles: 'Rolled three consecutive doubles - counter-revolutionary dice behavior',
    denouncementGuilty: 'Found guilty in tribunal',
    debtDefault: 'Failed to pay debt within one round',
    pilferingCaught: 'Caught stealing at STOY checkpoint',
    stalinDecree: justification ?? 'Sent by Stalin',
    railwayCapture: 'Caught attempting to flee the motherland via railway',
    campLabour: 'Sent for forced labour by Siberian Camp custodian',
    voucherConsequence: 'Voucher consequence - vouchee committed an offence'
  }

  return reasonTexts[reason]
}

function getRequiredDoublesForEscape (turnsInGulag: number): number[] {
  switch (turnsInGulag) {
    case 1:
      return [6]
    case 2:
      return [5, 6]
    case 3:
      return [4, 5, 6]
    case 4:
      return [3, 4, 5, 6]
    default:
      return [1, 2, 3, 4, 5, 6] // Any doubles after turn 5
  }
}

function shouldTriggerVoucherConsequence (reason: GulagReason): boolean {
  // These reasons trigger voucher consequences
  const triggeringReasons: GulagReason[] = [
    'enemyOfState',
    'threeDoubles',
    'denouncementGuilty',
    'pilferingCaught',
    'stalinDecree',
    'railwayCapture',
    'campLabour'
  ]

  return triggeringReasons.includes(reason)
}

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

// Export for testing
export function calculateTotalWealth (player: Player, properties: Property[]): number {
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

// Export for testing
export function initializePlayerStats (): PlayerStatistics {
  return {
    turnsPlayed: 0,
    denouncementsMade: 0,
    denouncementsReceived: 0,
    tribunalsWon: 0,
    tribunalsLost: 0,
    totalGulagTurns: 0,
    gulagEscapes: 0,
    moneyEarned: 0,
    moneySpent: 0,
    propertiesOwned: 0,
    maxWealth: 1500,
    testsPassed: 0,
    testsFailed: 0
  }
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

  // Property management
  initializeProperties: () => void
  setPropertyCustodian: (spaceId: number, custodianId: string | null) => void
  updateCollectivizationLevel: (spaceId: number, level: number) => void
  purchaseProperty: (playerId: string, spaceId: number, price: number) => void
  payQuota: (payerId: string, custodianId: string, amount: number) => void
  mortgageProperty: (spaceId: number) => void
  unmortgageProperty: (spaceId: number, playerId: string) => void
  transferProperty: (propertyId: string, newCustodianId: string) => void

  // Turn management
  rollDice: () => void
  rollVodka3Dice: () => void
  finishRolling: () => void
  movePlayer: (playerId: string, spaces: number) => void
  finishMoving: () => void
  endTurn: () => void
  setTurnPhase: (phase: TurnPhase) => void

  // Gulag management
  sendToGulag: (playerId: string, reason: GulagReason, justification?: string) => void
  demotePlayer: (playerId: string) => void
  handleGulagTurn: (playerId: string) => void
  attemptGulagEscape: (playerId: string, method: GulagEscapeMethod, data?: Record<string, unknown>) => void
  checkFor10TurnElimination: (playerId: string) => void

  // Voucher system
  createVoucher: (prisonerId: string, voucherId: string) => void
  checkVoucherConsequences: (playerId: string, reason: GulagReason) => void
  expireVouchers: () => void

  // Bribe system
  submitBribe: (playerId: string, amount: number, reason: string) => void
  respondToBribe: (bribeId: string, accepted: boolean) => void

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
  calculateFinalStats: () => void

  // Unanimous end vote
  initiateEndVote: (initiatorId: string) => void
  castEndVote: (playerId: string, vote: boolean) => void

  // Statistics
  updatePlayerStat: (playerId: string, statKey: keyof PlayerStatistics, increment: number) => void

  // Confessions
  submitConfession: (prisonerId: string, confession: string) => void
  reviewConfession: (confessionId: string, accepted: boolean) => void

  // Round management
  incrementRound: () => void

  // STOY handling
  handleStoyPassing: (playerId: string) => void
  handleStoyPilfer: (playerId: string, diceRoll: number) => void

  // Card system
  drawPartyDirective: () => DirectiveCard
  drawCommunistTest: (difficulty?: 'easy' | 'medium' | 'hard' | 'trick') => TestQuestion
  applyDirectiveEffect: (card: DirectiveCard, playerId: string) => void
  answerCommunistTest: (question: TestQuestion, answer: string, readerId: string) => void

  // Piece abilities
  tankRequisition: (tankPlayerId: string, targetPlayerId: string) => void
  sickleHarvest: (sicklePlayerId: string, targetPropertyId: number) => void
  ironCurtainDisappear: (ironCurtainPlayerId: string, targetPropertyId: number) => void
  leninSpeech: (leninPlayerId: string, applauders: string[]) => void
  promotePlayer: (playerId: string) => void

  // Property special abilities
  siberianCampsGulag: (custodianId: string, targetPlayerId: string) => void
  kgbPreviewTest: (custodianId: string) => void
  ministryTruthRewrite: (custodianId: string, newRule: string) => void
  pravdaPressRevote: (custodianId: string, decision: string) => void

  // Game log
  addLogEntry: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void

  // Treasury
  adjustTreasury: (amount: number) => void

  // Pending actions
  setPendingAction: (action: PendingAction | null) => void

  // Denouncement and Tribunal
  canPlayerDenounce: (playerId: string) => { canDenounce: boolean, reason: string }
  initiateDenouncement: (accuserId: string, accusedId: string, crime: string) => void
  advanceTribunalPhase: () => void
  addWitness: (witnessId: string, side: 'for' | 'against') => void
  renderTribunalVerdict: (verdict: import('../types/game').TribunalVerdict) => void
  getWitnessRequirement: (playerId: string) => import('../types/game').WitnessRequirement

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

type GameStore = GameState & GameActions

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
  partyDirectiveDeck: shuffleDirectiveDeck().map(card => card.id),
  partyDirectiveDiscard: [],
  communistTestUsedQuestions: new Set(),

  // Game end tracking
  gameEndCondition: null,
  winnerId: null,
  showEndScreen: false,

  // Statistics
  gameStatistics: {
    gameStartTime: new Date(),
    totalTurns: 0,
    playerStats: {},
    totalDenouncements: 0,
    totalTribunals: 0,
    totalGulagSentences: 0,
    stateTreasuryPeak: 0
  },

  // Unanimous end vote
  endVoteInProgress: false,
  endVoteInitiator: null,
  endVotes: {},

  // Rehabilitation confessions
  confessions: [],

  // Denouncement and Tribunal System
  denouncementsThisRound: [],
  activeTribunal: null,

  // Special Decrees
  greatPurgeUsed: false,
  activeGreatPurge: null,
  activeFiveYearPlan: null,
  heroesOfSovietUnion: []
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialState,

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

      setPropertyCustodian: (spaceId, custodianId) => {
        set((state) => ({
          properties: state.properties.map((prop) =>
            prop.spaceId === spaceId ? { ...prop, custodianId } : prop
          )
        }))
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
              // Check if property is mortgaged - mortgaged properties don't charge quota
              if (property.mortgaged) {
                const custodian = state.players.find(p => p.id === property.custodianId)
                get().addLogEntry({
                  type: 'system',
                  message: `${currentPlayer.name} landed on ${space.name} (mortgaged by ${custodian?.name ?? 'unknown'}) - no quota charged`,
                  playerId: currentPlayer.id
                })
                set({ turnPhase: 'post-turn' })
              } else {
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

      endTurn: () => {
        const state = get()
        const { currentPlayerIndex, players, doublesCount } = state

        // If player rolled doubles and not in gulag, they get another turn
        if ((doublesCount) > 0 && !players[currentPlayerIndex]?.inGulag) {
          set({
            turnPhase: 'pre-roll',
            hasRolled: false,
            pendingAction: null
          })
          return
        }

        // Find next player (skip Stalin and eliminated players, but include Gulag players)
        let nextIndex: number = (currentPlayerIndex + 1) % players.length
        let attempts = 0

        while (
          (players[nextIndex].isStalin || players[nextIndex].isEliminated) &&
          attempts < players.length
        ) {
          nextIndex = (nextIndex + 1) % players.length
          attempts++
        }

        // Check if we've completed a round (cycling back to first non-Stalin player)
        // First non-Stalin player is typically at index 1
        const firstNonStalinIndex: number = players.findIndex((p) => !p.isStalin && !p.isEliminated)
        if (nextIndex === firstNonStalinIndex && currentPlayerIndex !== firstNonStalinIndex) {
          get().incrementRound()
        }

        set({
          currentPlayerIndex: nextIndex,
          turnPhase: 'pre-roll',
          doublesCount: 0,
          hasRolled: false,
          pendingAction: null
        })

        const nextPlayer = players[nextIndex]
        get().addLogEntry({
          type: 'system',
          message: `${nextPlayer.name}'s turn`,
          playerId: nextPlayer.id
        })
      },

      // Gulag management
      sendToGulag: (playerId, reason, justification) => {
        const state = get()
        const player = state.players.find((p) => p.id === playerId)
        if (player == null) return

        // HAMMER ABILITY: Cannot be sent to Gulag by other players
        // Blocked reasons: denouncementGuilty, threeDoubles
        if (player.piece === 'hammer' && (reason === 'denouncementGuilty' || reason === 'threeDoubles')) {
          get().addLogEntry({
            type: 'system',
            message: `${player.name}'s Hammer protects them from Gulag! (Player-initiated imprisonment blocked)`,
            playerId
          })
          set({ turnPhase: 'post-turn' })
          return
        }

        // TANK ABILITY: Immune to first Gulag sentence (return to nearest Railway Station instead)
        if (player.piece === 'tank' && !player.hasUsedTankGulagImmunity) {
          const railwayPositions = [5, 15, 25, 35]
          const currentPos = player.position

          // Find nearest railway station
          let nearestRailway = railwayPositions[0]
          let minDistance = Math.abs(currentPos - railwayPositions[0])

          railwayPositions.forEach(railPos => {
            const distance = Math.abs(currentPos - railPos)
            if (distance < minDistance) {
              minDistance = distance
              nearestRailway = railPos
            }
          })

          get().updatePlayer(playerId, {
            position: nearestRailway,
            hasUsedTankGulagImmunity: true
          })

          get().addLogEntry({
            type: 'system',
            message: `${player.name}'s Tank evades Gulag! Redirected to nearest Railway Station (immunity used)`,
            playerId
          })

          // Still demote player (loses rank but avoids Gulag)
          get().demotePlayer(playerId)

          set({ turnPhase: 'post-turn' })
          return
        }

        const reasonText = getGulagReasonText(reason, justification)

        get().updatePlayer(playerId, {
          inGulag: true,
          gulagTurns: 0,
          position: 10 // Gulag position
        })

        // Demote player
        get().demotePlayer(playerId)

        get().addLogEntry({
          type: 'gulag',
          message: `${player.name} sent to Gulag: ${reasonText}`,
          playerId
        })

        // Check voucher consequences if applicable
        get().checkVoucherConsequences(playerId, reason)

        // End turn immediately
        set({ turnPhase: 'post-turn' })
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

      // Property transactions
      purchaseProperty: (playerId, spaceId, price) => {
        const state = get()
        const player = state.players.find((p) => p.id === playerId)
        if (player == null || player.rubles < price) return

        // TANK ABILITY: Cannot control any Collective Farm properties
        const collectiveFarmSpaces = [6, 8, 9]
        if (player.piece === 'tank' && collectiveFarmSpaces.includes(spaceId)) {
          const space = getSpaceById(spaceId)
          get().addLogEntry({
            type: 'system',
            message: `${player.name}'s Tank cannot control Collective Farm properties! ${space?.name ?? 'Property'} purchase blocked.`,
            playerId
          })
          set({ pendingAction: null, turnPhase: 'post-turn' })
          return
        }

        // Deduct rubles
        get().updatePlayer(playerId, {
          rubles: player.rubles - price,
          properties: [...player.properties, spaceId.toString()]
        })

        // Set custodian
        get().setPropertyCustodian(spaceId, playerId)

        // Add to treasury
        get().adjustTreasury(price)

        const space = getSpaceById(spaceId)
        get().addLogEntry({
          type: 'property',
          message: `${player.name} became Custodian of ${space?.name ?? 'Unknown'} for ₽${String(price)}`,
          playerId
        })
      },

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

      mortgageProperty: (spaceId) => {
        const state = get()
        const property = state.properties.find((p) => p.spaceId === spaceId)
        if (property?.custodianId == null) return

        const space = getSpaceById(spaceId)
        const mortgageValue = Math.floor((space?.baseCost ?? 0) * 0.5)

        // Give player half the base cost
        const player = state.players.find((p) => p.id === property.custodianId)
        if (player != null) {
          const newRubles: number = (player.rubles) + mortgageValue
          get().updatePlayer(player.id, { rubles: newRubles })
        }

        // Mark as mortgaged
        set((state) => ({
          properties: state.properties.map((prop) =>
            prop.spaceId === spaceId ? { ...prop, mortgaged: true } : prop
          )
        }))

        get().addLogEntry({
          type: 'property',
          message: `${player?.name ?? 'Unknown'} mortgaged ${space?.name ?? 'Unknown'} for ₽${String(mortgageValue)}`,
          playerId: property.custodianId
        })
      },

      unmortgageProperty: (spaceId, playerId) => {
        const state = get()
        const property = state.properties.find((p) => p.spaceId === spaceId)
        const player = state.players.find((p) => p.id === playerId)
        if (property == null || player == null) return

        const space = getSpaceById(spaceId)
        const unmortgageCost = Math.floor((space?.baseCost ?? 0) * 0.6)

        if (player.rubles < unmortgageCost) return

        // Deduct cost
        get().updatePlayer(playerId, { rubles: player.rubles - unmortgageCost })

        // Unmark mortgaged
        set((state) => ({
          properties: state.properties.map((prop) =>
            prop.spaceId === spaceId ? { ...prop, mortgaged: false } : prop
          )
        }))

        get().addLogEntry({
          type: 'property',
          message: `${player.name} unmortgaged ${space?.name ?? 'Unknown'} for ₽${String(unmortgageCost)}`,
          playerId
        })
      },

      transferProperty: (propertyId, newCustodianId) => {
        const state = get()
        const spaceId = parseInt(propertyId)
        const property = state.properties.find((p) => p.spaceId === spaceId)
        if (property == null) return

        const oldCustodianId = property.custodianId

        // Update property custodian
        get().setPropertyCustodian(spaceId, newCustodianId)

        // Remove from old owner's properties array
        if (oldCustodianId != null) {
          const oldOwner = state.players.find((p) => p.id === oldCustodianId)
          if (oldOwner != null) {
            const updatedProperties = oldOwner.properties.filter((id) => id !== propertyId)
            get().updatePlayer(oldCustodianId, { properties: updatedProperties })
          }
        }

        // Add to new owner's properties array
        const newOwner = state.players.find((p) => p.id === newCustodianId)
        if (newOwner != null) {
          const updatedProperties = [...newOwner.properties, propertyId]
          get().updatePlayer(newCustodianId, { properties: updatedProperties })
        }
      },

      // Pending actions
      setPendingAction: (action) => {
        set({ pendingAction: action })
      },

      // New Gulag system functions
      handleGulagTurn: (playerId) => {
        const state = get()
        const player = state.players.find((p) => p.id === playerId)
        if (!player?.inGulag) return

        // Increment turn counter
        const newGulagTurns: number = (player.gulagTurns) + 1
        get().updatePlayer(playerId, { gulagTurns: newGulagTurns })

        get().addLogEntry({
          type: 'gulag',
          message: `${player.name} begins turn ${String(newGulagTurns)} in the Gulag`,
          playerId
        })

        // Check for 10-turn elimination
        get().checkFor10TurnElimination(playerId)

        // Show Gulag escape options if not eliminated
        const updatedPlayer = state.players.find((p) => p.id === playerId)
        if (updatedPlayer != null && !updatedPlayer.isEliminated) {
          set({ pendingAction: { type: 'gulag-escape-choice', data: { playerId } } })
        }
      },

      checkFor10TurnElimination: (playerId) => {
        const state = get()
        const player = state.players.find((p) => p.id === playerId)
        if (!player?.inGulag) return

        if (player.gulagTurns >= 10) {
          get().eliminatePlayer(playerId, 'gulagTimeout')
        }
      },

      attemptGulagEscape: (playerId, method) => {
        const state = get()
        const player = state.players.find((p) => p.id === playerId)
        if (!player?.inGulag) return

        switch (method) {
          case 'roll': {
            // This will be handled by the modal - check if doubles match requirements
            const requiredDoubles = getRequiredDoublesForEscape(player.gulagTurns)
            const dice = state.dice

            if (dice[0] === dice[1] && requiredDoubles.includes(dice[0])) {
              // Success! Escape the Gulag
              get().updatePlayer(playerId, {
                inGulag: false,
                gulagTurns: 0
              })

              const diceValue: number = dice[0]
              get().addLogEntry({
                type: 'gulag',
                message: `${player.name} rolled double ${String(diceValue)}s and escaped the Gulag!`,
                playerId
              })

              set({ turnPhase: 'post-turn', pendingAction: null })
            } else {
              // Failed escape
              get().addLogEntry({
                type: 'gulag',
                message: `${player.name} failed to escape the Gulag`,
                playerId
              })

              set({ turnPhase: 'post-turn', pendingAction: null })
            }
            break
          }

          case 'pay': {
            // Pay 500₽ and lose one rank
            if (player.rubles >= 500) {
              get().updatePlayer(playerId, {
                rubles: player.rubles - 500,
                inGulag: false,
                gulagTurns: 0
              })

              get().adjustTreasury(500)
              get().demotePlayer(playerId)

              get().addLogEntry({
                type: 'gulag',
                message: `${player.name} paid ₽500 for rehabilitation and was released (with demotion)`,
                playerId
              })

              set({ turnPhase: 'post-turn', pendingAction: null })
            }
            break
          }

          case 'vouch': {
            // Set up voucher request
            set({ pendingAction: { type: 'voucher-request', data: { prisonerId: playerId } } })
            break
          }

          case 'inform': {
            // Set up inform modal
            set({ pendingAction: { type: 'inform-on-player', data: { informerId: playerId } } })
            break
          }

          case 'bribe': {
            // Set up bribe modal
            set({ pendingAction: { type: 'bribe-stalin', data: { playerId, reason: 'gulag-escape' } } })
            break
          }

          case 'card': {
            // Use "Get out of Gulag free" card
            if (player.hasFreeFromGulagCard) {
              get().updatePlayer(playerId, {
                inGulag: false,
                gulagTurns: 0,
                hasFreeFromGulagCard: false // Remove the card
              })

              get().addLogEntry({
                type: 'gulag',
                message: `${player.name} used "Get out of Gulag free" card and was immediately released!`,
                playerId
              })

              set({ turnPhase: 'post-turn', pendingAction: null })
            }
            break
          }
        }
      },

      createVoucher: (prisonerId, voucherId) => {
        const state = get()
        const voucher: VoucherAgreement = {
          id: `voucher-${String(Date.now())}`,
          prisonerId,
          voucherId,
          expiresAtRound: (state.roundNumber) + 3,
          isActive: true
        }

        const prisoner = state.players.find((p) => p.id === prisonerId)
        const voucherPlayer = state.players.find((p) => p.id === voucherId)

        if (prisoner == null || voucherPlayer == null) return

        // Release prisoner immediately
        get().updatePlayer(prisonerId, {
          inGulag: false,
          gulagTurns: 0
        })

        // Update voucher's state
        get().updatePlayer(voucherId, {
          vouchingFor: prisonerId,
          vouchedByRound: voucher.expiresAtRound
        })

        set((state) => ({
          activeVouchers: [...state.activeVouchers, voucher],
          pendingAction: null
        }))

        get().addLogEntry({
          type: 'gulag',
          message: `${voucherPlayer.name} vouched for ${prisoner.name}'s release. WARNING: If ${prisoner.name} commits ANY offence in the next 3 rounds, ${voucherPlayer.name} goes to Gulag too!`
        })

        set({ turnPhase: 'post-turn' })
      },

      checkVoucherConsequences: (playerId, reason) => {
        const state = get()

        // Find active voucher where this player is the prisoner
        const activeVoucher = state.activeVouchers.find(
          (v) => v.prisonerId === playerId && v.isActive && state.roundNumber <= v.expiresAtRound
        )

        if (activeVoucher != null && shouldTriggerVoucherConsequence(reason)) {
          const voucherPlayer = state.players.find((p) => p.id === activeVoucher.voucherId)
          const player = state.players.find((p) => p.id === playerId)

          if (voucherPlayer != null && player != null) {
            // Voucher must also go to Gulag!
            get().sendToGulag(activeVoucher.voucherId, 'voucherConsequence')

            // Deactivate voucher
            set((state) => ({
              activeVouchers: state.activeVouchers.map((v) =>
                v.id === activeVoucher.id ? { ...v, isActive: false } : v
              )
            }))

            get().addLogEntry({
              type: 'gulag',
              message: `${voucherPlayer.name} sent to Gulag due to ${player.name}'s offence within voucher period!`
            })
          }
        }
      },

      expireVouchers: () => {
        const state = get()
        const expiredVouchers = state.activeVouchers.filter(
          (v) => v.isActive && state.roundNumber > v.expiresAtRound
        )

        expiredVouchers.forEach((voucher) => {
          const voucherPlayer = state.players.find((p) => p.id === voucher.voucherId)
          if (voucherPlayer != null) {
            get().updatePlayer(voucher.voucherId, {
              vouchingFor: null,
              vouchedByRound: null
            })
          }
        })

        if (expiredVouchers.length > 0) {
          set((state) => ({
            activeVouchers: state.activeVouchers.map((v) =>
              expiredVouchers.some((ev) => ev.id === v.id) ? { ...v, isActive: false } : v
            )
          }))
        }
      },

      submitBribe: (playerId, amount, reason) => {
        const state = get()
        const player = state.players.find((p) => p.id === playerId)
        if (player == null || player.rubles < amount) return

        const bribe: BribeRequest = {
          id: `bribe-${String(Date.now())}`,
          playerId,
          amount,
          reason,
          timestamp: new Date()
        }

        set((state) => ({
          pendingBribes: [...state.pendingBribes, bribe]
        }))

        get().addLogEntry({
          type: 'system',
          message: `${player.name} has submitted a bribe of ₽${String(amount)} to Stalin`,
          playerId
        })
      },

      respondToBribe: (bribeId, accepted) => {
        const state = get()
        const bribe = state.pendingBribes.find((b) => b.id === bribeId)
        if (bribe == null) return

        const player = state.players.find((p) => p.id === bribe.playerId)
        if (player == null) return

        // Always take the money
        get().updatePlayer(bribe.playerId, { rubles: player.rubles - bribe.amount })
        get().adjustTreasury(bribe.amount)

        if (accepted) {
          // Release from Gulag or grant favour
          if (bribe.reason === 'gulag-escape' && player.inGulag) {
            get().updatePlayer(bribe.playerId, {
              inGulag: false,
              gulagTurns: 0
            })

            get().addLogEntry({
              type: 'gulag',
              message: `Stalin accepted ${player.name}'s bribe of ₽${String(bribe.amount)} and released them from the Gulag`,
              playerId: bribe.playerId
            })

            set({ turnPhase: 'post-turn', pendingAction: null })
          }
        } else {
          // Rejected - money confiscated anyway
          get().addLogEntry({
            type: 'payment',
            message: `Stalin rejected ${player.name}'s bribe of ₽${String(bribe.amount)} and confiscated it as contraband`,
            playerId: bribe.playerId
          })
        }

        // Remove bribe from pending
        set((state) => ({
          pendingBribes: state.pendingBribes.filter((b) => b.id !== bribeId)
        }))
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

        // Calculate net ruble transfer
        const fromPlayerRubleChange = -trade.offering.rubles + trade.requesting.rubles
        const toPlayerRubleChange = trade.offering.rubles - trade.requesting.rubles

        // Apply ruble changes if any
        if (fromPlayerRubleChange !== 0) {
          get().updatePlayer(fromPlayer.id, { rubles: fromPlayer.rubles + fromPlayerRubleChange })
        }
        if (toPlayerRubleChange !== 0) {
          get().updatePlayer(toPlayer.id, { rubles: toPlayer.rubles + toPlayerRubleChange })
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

        // Transfer requesting properties
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

      calculateFinalStats: () => {
        set((state) => ({
          gameStatistics: {
            ...state.gameStatistics,
            gameEndTime: new Date(),
            totalTurns: state.roundNumber
          }
        }))
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

      updatePlayerStat: (playerId, statKey, increment) => {
        set((state) => ({
          gameStatistics: {
            ...state.gameStatistics,
            playerStats: {
              ...state.gameStatistics.playerStats,
              [playerId]: {
                ...state.gameStatistics.playerStats[playerId],
                [statKey]: state.gameStatistics.playerStats[playerId][statKey] + increment
              }
            }
          }
        }))
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
      drawPartyDirective: () => {
        const state = get()
        let { partyDirectiveDeck, partyDirectiveDiscard } = state

        // If deck is empty, reshuffle discard pile
        if (partyDirectiveDeck.length === 0) {
          partyDirectiveDeck = [...partyDirectiveDiscard].sort(() => Math.random() - 0.5)
          partyDirectiveDiscard = []
          get().addLogEntry({
            type: 'system',
            message: 'Party Directive deck reshuffled'
          })
        }

        const cardId = partyDirectiveDeck[0]
        const card = PARTY_DIRECTIVE_CARDS.find(c => c.id === cardId)

        if (card == null) {
          // Fallback if card not found
          return PARTY_DIRECTIVE_CARDS[0]
        }

        // Update deck state
        set({
          partyDirectiveDeck: partyDirectiveDeck.slice(1),
          partyDirectiveDiscard: [...partyDirectiveDiscard, cardId]
        })

        return card
      },

      drawCommunistTest: (difficulty) => {
        const state = get()
        const selectedDifficulty = difficulty ?? getRandomDifficulty()

        // Get all questions for this difficulty
        const allQuestions = COMMUNIST_TEST_QUESTIONS_BY_DIFFICULTY[selectedDifficulty]

        // Filter out already-used questions
        const availableQuestions = allQuestions.filter(q => !state.communistTestUsedQuestions.has(q.id))

        // If all questions have been used, reset the used set and use all questions
        const questionsToUse = availableQuestions.length > 0 ? availableQuestions : allQuestions

        // Select a random question from available pool
        const randomIndex = Math.floor(Math.random() * questionsToUse.length)
        const question = questionsToUse[randomIndex]

        // Mark question as used
        const newUsedQuestions = availableQuestions.length > 0
          ? new Set(state.communistTestUsedQuestions)
          : new Set()  // Reset if we exhausted all questions
        newUsedQuestions.add(question.id)

        set({ communistTestUsedQuestions: newUsedQuestions })

        return question
      },

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
      siberianCampsGulag: (custodianId, targetPlayerId) => {
        const state = get()
        const custodian = state.players.find(p => p.id === custodianId)
        const target = state.players.find(p => p.id === targetPlayerId)

        if ((custodian == null) || (target == null)) return
        if (custodian.hasUsedSiberianCampsGulag) return

        // Check if custodian owns both Siberian Camps (spaces 1 and 3)
        const ownsCampVorkuta = state.properties.find(p => p.spaceId === 1 && p.custodianId === custodianId)
        const ownsCampKolyma = state.properties.find(p => p.spaceId === 3 && p.custodianId === custodianId)

        if ((ownsCampVorkuta == null) || (ownsCampKolyma == null)) {
          get().addLogEntry({
            type: 'system',
            message: `${custodian.name} must control both Siberian Camps to use this ability!`
          })
          return
        }

        // Ask Stalin for approval (in real game, this would be a modal)
        const approved = window.confirm(
          `STALIN'S APPROVAL REQUIRED\n\n${custodian.name} wants to send ${target.name} to the Gulag for "labour needs".\n\nDo you approve?`
        )

        if (approved) {
          get().sendToGulag(targetPlayerId, 'campLabour')
          get().updatePlayer(custodianId, { hasUsedSiberianCampsGulag: true })

          get().addLogEntry({
            type: 'gulag',
            message: `${custodian.name} sent ${target.name} to the Gulag for forced labour! (Siberian Camps ability)`,
            playerId: custodianId
          })
        } else {
          get().addLogEntry({
            type: 'system',
            message: `Stalin denied ${custodian.name}'s request to send ${target.name} to the Gulag`
          })
        }

        set({ pendingAction: null })
      },

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

      // Denouncement and Tribunal System
      canPlayerDenounce: (playerId) => {
        const state = get()
        const player = state.players.find(p => p.id === playerId)

        if (player == null) {
          return { canDenounce: false, reason: 'Player not found' }
        }

        // Check if already denounced this round (unless Commissar or Inner Circle)
        const hasDenounced = state.denouncementsThisRound.some(d => d.accuserId === playerId)
        if (hasDenounced && player.rank !== 'commissar' && player.rank !== 'innerCircle') {
          return { canDenounce: false, reason: 'You may only denounce once per round (unless Commissar+)' }
        }

        return { canDenounce: true, reason: '' }
      },

      initiateDenouncement: (accuserId, accusedId, crime) => {
        const state = get()
        const accuser = state.players.find(p => p.id === accuserId)
        const accused = state.players.find(p => p.id === accusedId)

        if (accuser == null || accused == null) return

        // Create denouncement record
        const denouncement: import('../types/game').Denouncement = {
          id: `denouncement-${String(Date.now())}`,
          accuserId,
          accusedId,
          crime,
          timestamp: new Date(),
          roundNumber: state.roundNumber
        }

        // Get witness requirement for accused
        const witnessReq = get().getWitnessRequirement(accusedId)

        // Create tribunal
        const tribunal: import('../types/game').ActiveTribunal = {
          id: `tribunal-${String(Date.now())}`,
          accuserId,
          accusedId,
          crime,
          phase: 'accusation',
          phaseStartTime: new Date(),
          witnessesFor: [],
          witnessesAgainst: [],
          requiredWitnesses: witnessReq.required
        }

        set({
          denouncementsThisRound: [...state.denouncementsThisRound, denouncement],
          activeTribunal: tribunal
        })

        // Update statistics
        set({
          gameStatistics: {
            ...state.gameStatistics,
            totalDenouncements: state.gameStatistics.totalDenouncements + 1,
            totalTribunals: state.gameStatistics.totalTribunals + 1
          }
        })

        get().addLogEntry({
          type: 'tribunal',
          message: `${accuser.name} has denounced ${accused.name} for "${crime}". Tribunal is now in session!`
        })
      },

      getWitnessRequirement: (playerId) => {
        const state = get()
        const player = state.players.find(p => p.id === playerId)

        if (player == null) {
          return { required: 0, reason: 'Player not found' }
        }

        // Check if under suspicion
        if (player.underSuspicion) {
          return { required: 0, reason: 'Player is under suspicion - no witnesses required' }
        }

        // Check if Hero of Soviet Union
        const isHero = get().isHeroOfSovietUnion(playerId)
        if (isHero) {
          return { required: 'unanimous', reason: 'Hero of Soviet Union requires unanimous agreement' }
        }

        // Rank-based requirements
        switch (player.rank) {
          case 'commissar':
            return { required: 2, reason: 'Commissar rank requires 2 witnesses' }
          case 'innerCircle':
            return { required: 'unanimous', reason: 'Inner Circle rank requires unanimous agreement' }
          default:
            return { required: 0, reason: 'No witnesses required' }
        }
      },

      advanceTribunalPhase: () => {
        const state = get()
        if (state.activeTribunal == null) return

        const phaseOrder: import('../types/game').TribunalPhase[] = ['accusation', 'defence', 'witnesses', 'judgement']
        const currentIndex = phaseOrder.indexOf(state.activeTribunal.phase)
        const nextPhase = phaseOrder[currentIndex + 1]

        set({
          activeTribunal: {
            ...state.activeTribunal,
            phase: nextPhase,
            phaseStartTime: new Date()
          }
        })
      },

      addWitness: (witnessId, side) => {
        const state = get()
        if (state.activeTribunal == null) return

        const witness = state.players.find(p => p.id === witnessId)
        if (witness == null) return

        if (side === 'for') {
          set({
            activeTribunal: {
              ...state.activeTribunal,
              witnessesFor: [...state.activeTribunal.witnessesFor, witnessId]
            }
          })
        } else {
          set({
            activeTribunal: {
              ...state.activeTribunal,
              witnessesAgainst: [...state.activeTribunal.witnessesAgainst, witnessId]
            }
          })
        }

        get().addLogEntry({
          type: 'tribunal',
          message: `${witness.name} testified ${side === 'for' ? 'for the accuser' : 'for the accused'}`
        })
      },

      renderTribunalVerdict: (verdict) => {
        const state = get()
        if (state.activeTribunal == null) return

        const accuser = state.players.find(p => p.id === state.activeTribunal?.accuserId)
        const accused = state.players.find(p => p.id === state.activeTribunal?.accusedId)

        if (accuser == null || accused == null) return

        switch (verdict) {
          case 'guilty': {
            // Send accused to Gulag
            get().sendToGulag(accused.id, 'denouncementGuilty')

            // If accuser was in Gulag, release them (informant reward)
            if (accuser.inGulag) {
              get().updatePlayer(accuser.id, {
                inGulag: false,
                gulagTurns: 0,
                position: 10, // Release to Just Visiting
                rubles: accuser.rubles + 100
              })
              get().addLogEntry({
                type: 'gulag',
                message: `${accuser.name} is released from Gulag for successful denunciation and receives ₽100 informant bonus.`
              })
            } else {
              // Give accuser informant bonus
              get().updatePlayer(accuser.id, {
                rubles: accuser.rubles + 100
              })
              get().addLogEntry({
                type: 'tribunal',
                message: `GUILTY! ${accused.name} has been sent to the Gulag. ${accuser.name} receives ₽100 informant bonus.`
              })
            }

            // Update statistics
            get().updatePlayerStat(accuser.id, 'tribunalsWon', 1)
            get().updatePlayerStat(accused.id, 'tribunalsLost', 1)
            break
          }

          case 'innocent': {
            // Demote accuser
            get().demotePlayer(accuser.id)

            get().addLogEntry({
              type: 'tribunal',
              message: `INNOCENT! ${accused.name} is innocent. ${accuser.name} loses one rank for wasting the Party's time.`
            })

            // Update statistics
            get().updatePlayerStat(accuser.id, 'tribunalsLost', 1)
            get().updatePlayerStat(accused.id, 'tribunalsWon', 1)
            break
          }

          case 'bothGuilty': {
            // Send both to Gulag
            get().sendToGulag(accused.id, 'denouncementGuilty')
            get().sendToGulag(accuser.id, 'denouncementGuilty')

            get().addLogEntry({
              type: 'tribunal',
              message: `BOTH GUILTY! ${accuser.name} and ${accused.name} have both been sent to the Gulag.`
            })

            // Update statistics
            get().updatePlayerStat(accuser.id, 'tribunalsLost', 1)
            get().updatePlayerStat(accused.id, 'tribunalsLost', 1)
            break
          }

          case 'insufficient':
            // Mark accused as under suspicion
            get().updatePlayer(accused.id, {
              underSuspicion: true
            })

            get().addLogEntry({
              type: 'tribunal',
              message: `INSUFFICIENT EVIDENCE. ${accused.name} is now under suspicion. Next denouncement requires no witnesses.`
            })
            break
        }

        // Close tribunal
        set({ activeTribunal: null })
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
            get().sendToGulag(playerId, 'stalinDecree')
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

          get().sendToGulag(poorestPlayer.id, 'stalinDecree')
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
