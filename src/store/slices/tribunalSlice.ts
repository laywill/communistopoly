// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import { StateCreator } from 'zustand'
import type { GameStore } from '../types/storeTypes'
import type { Denouncement, ActiveTribunal, TribunalPhase, TribunalVerdict, WitnessRequirement } from '../../types/game'

// Slice state interface
export interface TribunalSliceState {
  denouncementsThisRound: Denouncement[]
  activeTribunal: ActiveTribunal | null
}

// Slice actions interface
export interface TribunalSliceActions {
  canPlayerDenounce: (playerId: string) => { canDenounce: boolean; reason: string }
  initiateDenouncement: (accuserId: string, accusedId: string, crime: string) => void
  getWitnessRequirement: (playerId: string) => WitnessRequirement
  advanceTribunalPhase: () => void
  addWitness: (witnessId: string, side: 'for' | 'against') => void
  renderTribunalVerdict: (verdict: TribunalVerdict) => void
}

// Combined slice type
export type TribunalSlice = TribunalSliceState & TribunalSliceActions

// Initial state for this slice
export const initialTribunalState: TribunalSliceState = {
  denouncementsThisRound: [],
  activeTribunal: null
}

// Slice creator with full typing
export const createTribunalSlice: StateCreator<
  GameStore,
  [],
  [],
  TribunalSlice
> = (set, get) => ({
  // Spread initial state
  ...initialTribunalState,

  // Check if a player can denounce another player
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

  // Initiate a denouncement against another player
  initiateDenouncement: (accuserId, accusedId, crime) => {
    const state = get()
    const accuser = state.players.find(p => p.id === accuserId)
    const accused = state.players.find(p => p.id === accusedId)

    if (accuser == null || accused == null) return

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

  // Get the witness requirement for denouncing a specific player
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

  // Advance the tribunal to the next phase
  advanceTribunalPhase: () => {
    const state = get()
    if (state.activeTribunal == null) return

    const phaseOrder: TribunalPhase[] = ['accusation', 'defence', 'witnesses', 'judgement']
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

  // Add a witness to the tribunal
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

  // Render the final verdict of the tribunal
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

          // Check if RedStar player at Proletariat should be executed
          get().checkRedStarExecutionAfterGulagRelease(accuser.id)
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
  }
})
