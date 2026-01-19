// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import type { Player, Property } from '../../types/game'
import { getSpaceById } from '../../data/spaces'

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
