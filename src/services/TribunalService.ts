// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import type { StoreGetter, GameService, SlicesStore } from './types'
import type { TribunalVerdict } from '../store/slices/tribunalSlice'

export interface TribunalService extends GameService {
  /**
   * Denounce a player and start a tribunal.
   * Handles validation, special Stalin case, and tribunal initialization.
   * Returns true if denouncement was successful, false otherwise.
   */
  denouncePlayer: (accuserId: string, accusedId: string, crime: string) => boolean

  /**
   * Render a verdict and apply consequences.
   * Handles: guilty, innocent, bothGuilty, insufficientEvidence verdicts.
   */
  renderVerdict: (verdict: TribunalVerdict) => void
}

export function createTribunalService(get: StoreGetter<SlicesStore>): TribunalService {
  const service: TribunalService = {
    name: 'TribunalService',

    denouncePlayer: (accuserId, accusedId, crime) => {
      const state = get()

      // Check eligibility
      const canDo = state.canDenounce(accuserId, accusedId)
      if (!canDo.allowed) {
        state.addGameLogEntry(`Denouncement blocked: ${canDo.reason ?? 'Unknown reason'}`)
        return false
      }

      const accuser = state.players.find((p) => p.id === accuserId)
      const accused = state.players.find((p) => p.id === accusedId)

      // Special case: Trying to denounce Stalin (though canDenounce should prevent this)
      if (accused?.isStalin) {
        // Send the accuser to Gulag for this counter-revolutionary act
        state.setPlayerInGulag(accuserId, true)
        state.setGulagTurns(accuserId, 0)
        state.setPlayerPosition(accuserId, 10) // Gulag position
        state.addGameLogEntry(`${accuser?.name ?? 'Someone'} foolishly attempted to denounce Stalin! Sent to Gulag.`)
        return false
      }

      // Increment denouncement count
      state.incrementDenouncementCount(accuserId)

      // Check if accuser is in Gulag (informing)
      const isGulagInform = accuser?.inGulag ?? false

      // Start tribunal
      state.startTribunal({ accuserId, accusedId, crime, isGulagInform })
      return true
    },

    renderVerdict: (verdict) => {
      const state = get()
      const tribunal = state.currentTribunal
      if (!tribunal) return

      const accuser = state.players.find((p) => p.id === tribunal.accuserId)
      const accused = state.players.find((p) => p.id === tribunal.accusedId)

      state.addGameLogEntry(`⚖️ VERDICT: ${verdict.toUpperCase()}`)

      switch (verdict) {
        case 'guilty': {
          // Accused → Gulag
          state.setPlayerInGulag(tribunal.accusedId, true)
          state.setGulagTurns(tribunal.accusedId, 0)
          state.setPlayerPosition(tribunal.accusedId, 10) // Gulag position

          // Demote accused player
          if (accused) {
            const ranks: ('proletariat' | 'partyMember' | 'commissar' | 'innerCircle')[] = ['proletariat', 'partyMember', 'commissar', 'innerCircle']
            const currentIdx = ranks.indexOf(accused.rank)
            if (currentIdx > 0) {
              state.setPlayerRank(tribunal.accusedId, ranks[currentIdx - 1])
            }
          }

          // Accuser gets 100₽ informant bonus
          if (accuser) {
            state.updatePlayer(tribunal.accuserId, { rubles: accuser.rubles + 100 })
            state.addGameLogEntry(`${accuser.name} receives 100₽ informant bonus`)
          }

          // If this was a Gulag inform, release the informer
          if (tribunal.isGulagInform === true) {

            state.releaseFromGulag(tribunal.accuserId, 'successful informing')
          }
          break
        }

        case 'innocent': {
          // Accuser loses rank for wasting Party's time
          if (accuser) {
            const ranks: ('proletariat' | 'partyMember' | 'commissar' | 'innerCircle')[] = ['proletariat', 'partyMember', 'commissar', 'innerCircle']
            const currentIdx = ranks.indexOf(accuser.rank)
            if (currentIdx > 0) {
              state.setPlayerRank(tribunal.accuserId, ranks[currentIdx - 1])
            }
          }
          state.addGameLogEntry(`${accuser?.name ?? 'Accuser'} demoted for wasting the Party's time!`)

          // If Gulag inform, add 2 turns to informer's sentence
          if (tribunal.isGulagInform === true && accuser) {
            const currentTurns = accuser.gulagTurns || 0
            state.updatePlayer(tribunal.accuserId, { gulagTurns: currentTurns + 2 })
            state.addGameLogEntry(`${accuser.name}'s Gulag sentence extended by 2 turns for false accusation`)
          }
          break
        }

        case 'bothGuilty': {
          // Both go to Gulag
          state.setPlayerInGulag(tribunal.accuserId, true)
          state.setGulagTurns(tribunal.accuserId, 0)
          state.setPlayerPosition(tribunal.accuserId, 10)

          state.setPlayerInGulag(tribunal.accusedId, true)
          state.setGulagTurns(tribunal.accusedId, 0)
          state.setPlayerPosition(tribunal.accusedId, 10)

          // Demote both players
          if (accuser) {
            const ranks: ('proletariat' | 'partyMember' | 'commissar' | 'innerCircle')[] = ['proletariat', 'partyMember', 'commissar', 'innerCircle']
            const currentIdx = ranks.indexOf(accuser.rank)
            if (currentIdx > 0) {
              state.setPlayerRank(tribunal.accuserId, ranks[currentIdx - 1])
            }
          }
          if (accused) {
            const ranks: ('proletariat' | 'partyMember' | 'commissar' | 'innerCircle')[] = ['proletariat', 'partyMember', 'commissar', 'innerCircle']
            const currentIdx = ranks.indexOf(accused.rank)
            if (currentIdx > 0) {
              state.setPlayerRank(tribunal.accusedId, ranks[currentIdx - 1])
            }
          }
          break
        }

        case 'insufficientEvidence': {
          // Mark accused as under suspicion
          state.markUnderSuspicion(tribunal.accusedId)
          state.addGameLogEntry(`${accused?.name ?? 'Accused'} is now under suspicion (next denouncement needs no witnesses)`)
          break
        }
      }

      // Clear the tribunal
      state.clearTribunal()
    },
  }

  return service
}
