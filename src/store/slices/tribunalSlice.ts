// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { StateCreator } from 'zustand'
import type { GameState, Player, PartyRank, TribunalVerdict, ActiveTribunal, Denouncement, WitnessRequirement } from '../../types/game'

export interface TribunalSliceState {
  denouncementsThisRound: Denouncement[]
  activeTribunal: ActiveTribunal | null
}

export interface TribunalSliceActions {
  // Denouncement initiation
  canPlayerDenounce: (playerId: string) => { canDenounce: boolean, reason: string }
  initiateDenouncement: (accuserId: string, accusedId: string, crime: string) => void

  // Tribunal flow
  advanceTribunalPhase: () => void
  addWitness: (witnessId: string, side: 'for' | 'against') => void

  // Verdict
  renderTribunalVerdict: (verdict: TribunalVerdict) => void

  // Queries
  getWitnessRequirement: (playerId: string) => WitnessRequirement
  hasEnoughWitnesses: () => boolean
}

export type TribunalSlice = TribunalSliceState & TribunalSliceActions

export const initialTribunalState: TribunalSliceState = {
  denouncementsThisRound: [],
  activeTribunal: null,
}

export const createTribunalSlice: StateCreator<
  GameState,
  [],
  [],
  TribunalSlice
> = (set, get) => ({
  ...initialTribunalState,

  canPlayerDenounce: (playerId) => {
    const state = get()
    const player = state.players.find((p) => p.id === playerId)

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

    // Check basic eligibility
    const eligibility = get().canPlayerDenounce(accuserId)
    if (!eligibility.canDenounce) {
      get().addLogEntry({
        type: 'system',
        message: `Denouncement blocked: ${eligibility.reason}`
      })
      return
    }

    // Can't denounce yourself
    if (accuserId === accusedId) {
      get().addLogEntry({
        type: 'system',
        message: 'Cannot denounce yourself'
      })
      return
    }

    // Can't denounce Stalin (trigger Gulag instead)
    if (accused.isStalin) {
      get().sendToGulag(accuserId, 'stalinDecree', 'Attempted to denounce Comrade Stalin')
      get().addLogEntry({
        type: 'tribunal',
        message: `${accuser.name} foolishly attempted to denounce Stalin and was sent to Gulag`
      })
      return
    }

    // Can't denounce someone in Gulag
    if (accused.inGulag) {
      get().addLogEntry({
        type: 'system',
        message: 'Cannot denounce someone already in Gulag'
      })
      return
    }

    // Can't denounce eliminated players
    if (accused.isEliminated) {
      get().addLogEntry({
        type: 'system',
        message: 'Cannot denounce an eliminated player'
      })
      return
    }

    // Lenin Statue protection: Can't be denounced by lower rank
    if (accused.piece === 'statueOfLenin') {
      const rankOrder: PartyRank[] = ['proletariat', 'partyMember', 'commissar', 'innerCircle']
      const accuserRankIndex = rankOrder.indexOf(accuser.rank)
      const accusedRankIndex = rankOrder.indexOf(accused.rank)
      if (accuserRankIndex < accusedRankIndex) {
        get().addLogEntry({
          type: 'tribunal',
          message: `${accused.name}'s Lenin Statue cannot be denounced by lower rank`
        })
        return
      }
    }

    // Create denouncement record
    const denouncement: Denouncement = {
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
    const tribunal: ActiveTribunal = {
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
    get().incrementTotalDenouncements()
    get().incrementTotalTribunals()

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

  hasEnoughWitnesses: () => {
    const state = get()
    const tribunal = state.activeTribunal
    if (tribunal == null) return false

    const accused = state.players.find((p) => p.id === tribunal.accusedId)
    if (accused == null) return false

    // If accused is under suspicion, no witnesses needed
    if (accused.underSuspicion) return true

    const requirement = get().getWitnessRequirement(accused.id)

    if (requirement.required === 'unanimous') {
      // Unanimous: all active players (not in Gulag, not accuser/accused) must witness
      const eligiblePlayers = state.players.filter(
        (p) => !p.inGulag &&
               !p.isStalin &&
               p.id !== tribunal.accuserId &&
               p.id !== tribunal.accusedId &&
               !p.isEliminated
      )
      return tribunal.witnessesFor.length === eligiblePlayers.length
    }

    return tribunal.witnessesFor.length >= (requirement.required as number)
  },

  advanceTribunalPhase: () => {
    const state = get()
    if (state.activeTribunal == null) return

    const phaseOrder: ActiveTribunal['phase'][] = ['accusation', 'defence', 'witnesses', 'judgement']
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

    // Can't witness your own trial
    if (witnessId === state.activeTribunal.accuserId || witnessId === state.activeTribunal.accusedId) {
      get().addLogEntry({
        type: 'tribunal',
        message: 'Cannot witness your own trial'
      })
      return
    }

    // Can't witness if in Gulag
    if (witness.inGulag) {
      get().addLogEntry({
        type: 'tribunal',
        message: 'Cannot witness from the Gulag'
      })
      return
    }

    // Can't witness if eliminated
    if (witness.isEliminated) {
      get().addLogEntry({
        type: 'tribunal',
        message: 'Eliminated players cannot witness'
      })
      return
    }

    // Can't witness for both sides
    const otherSide = side === 'for' ? 'against' : 'for'
    const otherSideWitnesses = otherSide === 'for' ? state.activeTribunal.witnessesFor : state.activeTribunal.witnessesAgainst
    if (otherSideWitnesses.includes(witnessId)) {
      get().addLogEntry({
        type: 'tribunal',
        message: 'Cannot witness for both sides'
      })
      return
    }

    // Already a witness for this side
    const currentSideWitnesses = side === 'for' ? state.activeTribunal.witnessesFor : state.activeTribunal.witnessesAgainst
    if (currentSideWitnesses.includes(witnessId)) {
      return
    }

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

        // Give accuser informant bonus
        get().updatePlayer(accuser.id, {
          rubles: accuser.rubles + 100
        })

        get().addLogEntry({
          type: 'tribunal',
          message: `GUILTY! ${accused.name} has been sent to the Gulag. ${accuser.name} receives ₽100 informant bonus.`
        })

        // Update statistics
        get().updatePlayerStat(accuser.id, 'tribunalsWon', 1)
        get().updatePlayerStat(accused.id, 'tribunalsLost', 1)
        break
      }

      case 'innocent': {
        // Demote accuser for wasting Party's time
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
        // Store IDs and names before state changes
        const accuserId = state.activeTribunal.accuserId
        const accusedId = state.activeTribunal.accusedId
        const accuserName = accuser.name
        const accusedName = accused.name

        // Send both to Gulag
        get().sendToGulag(accusedId, 'denouncementGuilty')
        get().sendToGulag(accuserId, 'denouncementGuilty')

        get().addLogEntry({
          type: 'tribunal',
          message: `BOTH GUILTY! ${accuserName} and ${accusedName} have both been sent to the Gulag.`
        })

        // Update statistics
        get().updatePlayerStat(accuserId, 'tribunalsLost', 1)
        get().updatePlayerStat(accusedId, 'tribunalsLost', 1)
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
})

function demoteRank(rank: PartyRank): PartyRank {
  const ranks: PartyRank[] = ['proletariat', 'partyMember', 'commissar', 'innerCircle']
  const index = ranks.indexOf(rank)
  return ranks[Math.max(0, index - 1)]
}
