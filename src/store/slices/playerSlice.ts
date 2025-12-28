import { StateCreator } from 'zustand'
import type { GameState, Player, PieceType, PartyRank } from '../../types/game'

// ============================================
// STATE
// ============================================

export interface PlayerSliceState {
  players: Player[]
}

export const initialPlayerState: PlayerSliceState = {
  players: [],
}

// ============================================
// ACTIONS (Pure state operations)
// ============================================

export interface PlayerSliceActions {
  // Player CRUD
  addPlayer: (name: string, piece: PieceType) => string
  removePlayer: (playerId: string) => void
  updatePlayer: (playerId: string, updates: Partial<Player>) => void

  // Stalin
  setStalin: (playerId: string) => void

  // Money
  addMoney: (playerId: string, amount: number) => void
  removeMoney: (playerId: string, amount: number) => boolean
  setMoney: (playerId: string, amount: number) => void

  // Position
  setPlayerPosition: (playerId: string, position: number) => void

  // Rank
  setPlayerRank: (playerId: string, rank: PartyRank) => void

  // Elimination
  eliminatePlayer: (playerId: string, reason: string) => void

  // Piece abilities
  markTankImmunityUsed: (playerId: string) => void
  markSickleHarvestUsed: (playerId: string) => void
  markIronCurtainDisappearUsed: (playerId: string) => void
  markLeninSpeechUsed: (playerId: string) => void
  incrementDrinkCount: (playerId: string) => void
  setHammerAbilityLost: (playerId: string, lost: boolean) => void

  // Round reset
  resetDenouncementCounts: () => void

  // Queries
  getPlayer: (playerId: string) => Player | undefined
  getActivePlayers: () => Player[]
  getNonStalinPlayers: () => Player[]
  getStalin: () => Player | undefined
  getPlayerByPiece: (piece: PieceType) => Player | undefined
}

export type PlayerSlice = PlayerSliceState & PlayerSliceActions

// ============================================
// HELPERS
// ============================================

function generatePlayerId (): string {
  return `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function createInitialPlayer (name: string, piece: PieceType): Player {
  return {
    id: generatePlayerId(),
    name,
    piece,
    rank: piece === 'redStar' ? 'partyMember' : 'proletariat',
    rubles: 1500,
    position: 0,
    properties: [],
    inGulag: false,
    gulagTurns: 0,
    isEliminated: false,
    isStalin: false,
    correctTestAnswers: 0,
    consecutiveFailedTests: 0,
    underSuspicion: false,
    denouncementsMadeThisRound: 0,
    skipNextTurn: false,
    usedRailwayGulagPower: false,
    hasUsedSiberianCampsGulag: false,
    kgbTestPreviewsUsedThisRound: 0,
    hasUsedMinistryTruthRewrite: false,
    hasUsedPravdaPressRevote: false,
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
  }
}

// ============================================
// SLICE CREATOR
// ============================================

export const createPlayerSlice: StateCreator<
  GameState,
  [],
  [],
  PlayerSlice
> = (set, get) => ({
  ...initialPlayerState,

  addPlayer: (name, piece) => {
    const newPlayer = createInitialPlayer(name, piece)

    set((state) => ({
      players: [...state.players, newPlayer],
    }))

    return newPlayer.id
  },

  removePlayer: (playerId) => {
    set((state) => ({
      players: state.players.filter((p) => p.id !== playerId),
    }))
  },

  updatePlayer: (playerId, updates) => {
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, ...updates } : p
      ),
    }))
  },

  setStalin: (playerId) => {
    set((state) => ({
      players: state.players.map((p) => ({
        ...p,
        isStalin: p.id === playerId,
      })),
    }))
  },

  addMoney: (playerId, amount) => {
    set((state) => ({
      players: state.players.map((p) => {
        if (p.id !== playerId) return p

        let newRubles = p.rubles + amount

        // Bread Loaf: Cap at 1000₽
        if (p.piece === 'breadLoaf' && newRubles > 1000) {
          const excess = newRubles - 1000
          // Excess goes to state (handled by caller)
          newRubles = 1000
          // Note: Caller should call addToStateTreasury(excess)
        }

        return { ...p, rubles: newRubles }
      }),
    }))
  },

  removeMoney: (playerId, amount) => {
    const player = get().players.find((p) => p.id === playerId)
    if (!player || player.rubles < amount) return false

    set((state) => ({
      players: state.players.map((p) => {
        if (p.id !== playerId) return p

        const newRubles = p.rubles - amount

        return { ...p, rubles: newRubles }
      }),
    }))

    return true
  },

  setMoney: (playerId, amount) => {
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, rubles: amount } : p
      ),
    }))
  },

  setPlayerPosition: (playerId, position) => {
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, position: position % 40 } : p
      ),
    }))
  },

  setPlayerRank: (playerId, rank) => {
    const player = get().players.find((p) => p.id === playerId)

    // Red Star elimination check
    if (player?.piece === 'redStar' && rank === 'proletariat') {
      get().eliminatePlayer(playerId, 'Red Star fell to Proletariat')
      return
    }

    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, rank } : p
      ),
    }))
  },

  eliminatePlayer: (playerId, reason) => {
    const player = get().players.find((p) => p.id === playerId)

    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, isEliminated: true } : p
      ),
    }))

    get().addGameLogEntry?.(`☠️ ${player?.name} eliminated: ${reason}`)
    get().checkGameEnd?.()
  },

  // Piece ability markers
  markTankImmunityUsed: (playerId) => {
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, hasUsedTankGulagImmunity: true } : p
      ),
    }))
  },

  markSickleHarvestUsed: (playerId) => {
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, hasUsedSickleHarvest: true } : p
      ),
    }))
  },

  markIronCurtainDisappearUsed: (playerId) => {
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, hasUsedIronCurtainDisappear: true } : p
      ),
    }))
  },

  markLeninSpeechUsed: (playerId) => {
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, hasUsedLeninSpeech: true } : p
      ),
    }))
  },

  incrementDrinkCount: (playerId) => {
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, vodkaUseCount: p.vodkaUseCount + 1 } : p
      ),
    }))
  },

  setHammerAbilityLost: (playerId, lost) => {
    // Note: This field doesn't exist in the Player type
    // Keeping as no-op for compatibility
  },

  resetDenouncementCounts: () => {
    set((state) => ({
      players: state.players.map((p) => ({
        ...p,
        denouncementsMadeThisRound: 0,
      })),
    }))
  },

  // Queries
  getPlayer: (playerId) => {
    return get().players.find((p) => p.id === playerId)
  },

  getActivePlayers: () => {
    return get().players.filter((p) => !p.isEliminated && !p.isStalin)
  },

  getNonStalinPlayers: () => {
    return get().players.filter((p) => !p.isStalin)
  },

  getStalin: () => {
    return get().players.find((p) => p.isStalin)
  },

  getPlayerByPiece: (piece) => {
    return get().players.find((p) => p.piece === piece)
  },
})
