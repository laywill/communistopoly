// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import type { DirectiveEffect } from '../../data/partyDirectiveCards'
import type { GameStore } from '../types/storeTypes'
import { calculateRailwayFee } from '../../utils/propertyUtils'
import { RAILWAY_SPACE_IDS } from '../constants'

/**
 * Applies the effect of a Party Directive card for the given player.
 *
 * Early-return cases (move, moveRelative, unowned railway, tribunal) handle
 * their own turn-phase transition. All other cases fall through to the
 * default post-turn cleanup at the end of the function.
 */
export function applyDirectiveEffectHandler(
  effect: DirectiveEffect,
  playerId: string,
  get: () => GameStore,
): void {
  const state = get()
  const player = state.players.find(p => p.id === playerId)
  if (player == null) return

  switch (effect.type) {
    case 'move':
      if (effect.destination !== undefined) {
        const oldPosition = player.position
        get().updatePlayer(playerId, { position: effect.destination })
        // Check if passed STOY (wrapped around the board).
        if (oldPosition > effect.destination && effect.destination === 0) {
          // Moving backwards to STOY (wrapping around) - pay travel tax
          get().handleStoyPassing(playerId)
        } else if (oldPosition < effect.destination && effect.destination !== 0) {
          // Moving forward past STOY (not landing on it)
          get().handleStoyPassing(playerId)
        }
        // Resolve the space the player landed on
        get().setTurnPhase('resolving')
        get().resolveCurrentSpace(playerId)
        return // Exit early; resolveCurrentSpace handles turn phase
      }
      break

    case 'moveRelative':
      if (effect.spaces !== undefined) {
        get().movePlayer(playerId, effect.spaces)
        // Resolve the space the player landed on
        get().setTurnPhase('resolving')
        get().resolveCurrentSpace(playerId)
        return // Exit early; resolveCurrentSpace handles turn phase
      }
      break

    case 'money':
      if (effect.amount !== undefined) {
        get().updatePlayer(playerId, { rubles: player.rubles + effect.amount })
        if (effect.amount > 0) {
          get().adjustTreasury(-effect.amount)
        } else {
          get().adjustTreasury(Math.abs(effect.amount))
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
      if (effect.direction === 'up') {
        get().promotePlayer(playerId)
      } else {
        get().demotePlayer(playerId)
      }
      break

    case 'collectFromAll':
      if (effect.amount !== undefined) {
        const collectAmount = effect.amount
        state.players.forEach(p => {
          if (!p.isStalin && p.id !== playerId && !p.isEliminated) {
            const payment = Math.min(collectAmount, p.rubles)
            get().updatePlayer(p.id, { rubles: p.rubles - payment })
            const currentBalance = get().players.find(cp => cp.id === playerId)?.rubles ?? 0
            get().updatePlayer(playerId, { rubles: currentBalance + payment })
          }
        })
      }
      break

    case 'payToAll':
      if (effect.amount !== undefined) {
        const payAmount = effect.amount
        state.players.forEach(p => {
          if (!p.isStalin && p.id !== playerId && !p.isEliminated) {
            const currentBalance = get().players.find(cp => cp.id === playerId)?.rubles ?? 0
            const payment = Math.min(payAmount, currentBalance)
            get().updatePlayer(playerId, { rubles: currentBalance - payment })
            get().updatePlayer(p.id, { rubles: p.rubles + payment })
          }
        })
      }
      break

    case 'propertyTax': {
      const properties = state.properties.filter(p => p.custodianId === playerId)
      let totalTax = 0
      if (effect.perProperty) {
        totalTax += properties.length * effect.perProperty
      }
      if (effect.perImprovement) {
        const totalImprovements = properties.reduce((sum, p) => sum + p.collectivizationLevel, 0)
        totalTax += totalImprovements * effect.perImprovement
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
      if (effect.handler === 'advanceToNearestRailway') {
        const railwayPositions = [...RAILWAY_SPACE_IDS]
        const currentPosition = player.position

        // Find the nearest railway ahead (wrapping around)
        let nearestRailway = railwayPositions[0]
        for (const railwayPos of railwayPositions) {
          if (railwayPos > currentPosition) {
            nearestRailway = railwayPos
            break
          }
        }

        // Move player to railway
        const oldPosition = player.position
        get().updatePlayer(playerId, { position: nearestRailway })

        // Only give STOY bonus if we actually wrapped around
        if (oldPosition > nearestRailway) {
          get().handleStoyPassing(playerId)
        }

        // Check railway property ownership
        const railwayProperty = state.properties.find(p => p.spaceId === nearestRailway)

        if (railwayProperty != null) {
          if (railwayProperty.custodianId === null) {
            // Railway is unowned - set pending action for purchase
            get().setPendingAction({
              type: 'property-purchase',
              data: { spaceId: nearestRailway, playerId }
            })
            get().setTurnPhase('resolving')
            return // Exit early; awaiting player decision
          } else if (railwayProperty.custodianId !== playerId && !railwayProperty.mortgaged) {
            // Railway is owned by another player - charge fee
            const fee = calculateRailwayFee(railwayProperty.custodianId, state.properties)
            get().payQuota(playerId, railwayProperty.custodianId, fee)
          }
          // If owned by current player or mortgaged, no fee charged
        }
      } else if (effect.handler === 'triggerAnonymousTribunal') {
        // Trigger tribunal with Stalin as accuser
        const stalin = state.players.find(p => p.isStalin)
        if (stalin != null) {
          get().setPendingAction({
            type: 'tribunal',
            data: { targetId: playerId, accuserId: stalin.id, isAnonymous: true }
          })
          get().setTurnPhase('resolving')
          return // Exit early; awaiting tribunal resolution
        }
      } else {
        // Unknown custom handler
        get().addLogEntry({
          type: 'system',
          message: `Custom effect: ${effect.handler ?? 'unknown'} - requires special handling`,
          playerId
        })
      }
      break
  }

  // Default completion: clear pending action and advance to post-turn
  get().setPendingAction(null)
  get().setTurnPhase('post-turn')
}
