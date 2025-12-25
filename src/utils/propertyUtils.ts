import { Player, Property, PartyRank, PropertyGroup } from '../types/game'
import { PROPERTY_GROUPS, getCollectivizationMultiplier } from '../data/properties'
import { getSpaceById } from '../data/spaces'

/**
 * Check if a player owns all properties in a group
 */
export function ownsCompleteGroup (
  custodianId: string,
  group: PropertyGroup,
  properties: Property[]
): boolean {
  const groupPropertyIds = PROPERTY_GROUPS[group].properties

  return groupPropertyIds.every((spaceId) => {
    const property = properties.find((p) => p.spaceId === spaceId)
    return property?.custodianId === custodianId
  })
}

/**
 * Calculate the quota owed for landing on a property
 */
export function calculateQuota (
  property: Property,
  properties: Property[],
  landingPlayer?: Player
): number {
  const space = getSpaceById(property.spaceId)
  if (space?.baseQuota == null || (space.baseQuota === 0)) return 0

  let quota = space.baseQuota

  // Apply collectivization multiplier
  quota *= getCollectivizationMultiplier(property.collectivizationLevel)

  // Check for complete group ownership (doubles quota)
  if ((property.custodianId != null) && (space.group != null)) {
    const hasCompleteGroup = ownsCompleteGroup(property.custodianId, space.group, properties)
    if (hasCompleteGroup) {
      quota *= 2
    }
  }

  // Party Elite District: Lower ranks pay double
  if (space.group === 'elite' && (landingPlayer != null)) {
    if (landingPlayer.rank === 'proletariat') {
      quota *= 2
    }
  }

  // SICKLE ABILITY: Half quota on Collective Farm properties
  if (landingPlayer?.piece === 'sickle' && space.group === 'collective') {
    quota *= 0.5
  }

  return Math.floor(quota)
}

/**
 * Calculate railway fee based on number of stations owned
 */
export function calculateRailwayFee (controllerId: string, properties: Property[]): number {
  const railwayIds = PROPERTY_GROUPS.railroad.properties
  const ownedCount = railwayIds.filter((spaceId) => {
    const property = properties.find((p) => p.spaceId === spaceId)
    return property?.custodianId === controllerId
  }).length

  const fees = [50, 100, 150, 200] // 1-4 stations
  return fees[ownedCount - 1] ?? 0
}

/**
 * Calculate utility fee based on dice roll and number of utilities owned
 */
export function calculateUtilityFee (
  controllerId: string,
  diceTotal: number,
  properties: Property[]
): number {
  const utilityIds = PROPERTY_GROUPS.utility.properties
  const ownedCount = utilityIds.filter((spaceId) => {
    const property = properties.find((p) => p.spaceId === spaceId)
    return property?.custodianId === controllerId
  }).length

  const multiplier = ownedCount === 2 ? 10 : 4
  return diceTotal * multiplier
}

/**
 * Check if player can purchase a property based on rank restrictions
 */
export function canPurchaseProperty (player: Player, propertyGroup: PropertyGroup): boolean {
  // TANK ABILITY: Cannot control Collective Farm properties
  if (player.piece === 'tank' && propertyGroup === 'collective') {
    return false
  }

  switch (propertyGroup) {
    case 'elite':
      // Green properties: Party Member or higher
      return player.rank !== 'proletariat'

    case 'kremlin':
      // Dark Blue (Kremlin): Inner Circle only
      return player.rank === 'innerCircle'

    case 'utility':
      // Utilities: Commissar or higher
      return player.rank === 'commissar' || player.rank === 'innerCircle'

    default:
      return true
  }
}

/**
 * Get rank discount percentage for State purchases
 */
export function getRankDiscount (rank: PartyRank): number {
  switch (rank) {
    case 'proletariat':
      return 0
    case 'partyMember':
      return 0.1 // 10%
    case 'commissar':
      return 0.2 // 20%
    case 'innerCircle':
      return 0.5 // 50%
    default:
      return 0
  }
}

/**
 * Calculate total wealth of a player (for tax purposes)
 */
export function calculateTotalWealth (
  player: Player,
  properties: Property[]
): number {
  let wealth = player.rubles

  // Add property values
  for (const propertyId of player.properties) {
    const spaceId = parseInt(propertyId)
    const space = getSpaceById(spaceId)
    const property = properties.find((p) => p.spaceId === spaceId)

    if ((space?.baseCost != null) && (space.baseCost > 0)) {
      // Base cost
      wealth += space.baseCost

      // Add collectivization value
      if (property != null) {
        const improvementCost = property.collectivizationLevel * 100
        wealth += improvementCost
      }
    }
  }

  return wealth
}

/**
 * Check if a property can be improved
 */
export function canImproveProperty (
  spaceId: number,
  custodianId: string,
  properties: Property[]
): { canImprove: boolean, reason?: string } {
  const property = properties.find((p) => p.spaceId === spaceId)
  if (property == null) {
    return { canImprove: false, reason: 'Property not found' }
  }

  if (property.custodianId !== custodianId) {
    return { canImprove: false, reason: 'Not the custodian' }
  }

  if (property.collectivizationLevel >= 5) {
    return { canImprove: false, reason: 'Maximum level reached' }
  }

  if (property.mortgaged) {
    return { canImprove: false, reason: 'Property is mortgaged' }
  }

  const space = getSpaceById(spaceId)
  if (space?.group == null) {
    return { canImprove: false, reason: 'Invalid property' }
  }

  // Check for complete group ownership (required for People's Palace)
  if (property.collectivizationLevel === 4) {
    const hasCompleteGroup = ownsCompleteGroup(custodianId, space.group, properties)
    if (!hasCompleteGroup) {
      return { canImprove: false, reason: 'Must own all properties in group for People\'s Palace' }
    }
  }

  // Check for even building across group
  const groupPropertyIds = PROPERTY_GROUPS[space.group].properties
  const groupProperties = groupPropertyIds.map((id) =>
    properties.find((p) => p.spaceId === id)
  ).filter((p) => p?.custodianId === custodianId)

  const minLevel = Math.min(...groupProperties.map((p) => p?.collectivizationLevel ?? 0))
  if (property.collectivizationLevel > minLevel) {
    return { canImprove: false, reason: 'Must improve evenly across color group' }
  }

  return { canImprove: true }
}

/**
 * Get count of railways owned by a player
 */
export function getRailwayCount (custodianId: string, properties: Property[]): number {
  const railwayIds = PROPERTY_GROUPS.railroad.properties
  return railwayIds.filter((spaceId) => {
    const property = properties.find((p) => p.spaceId === spaceId)
    return property?.custodianId === custodianId
  }).length
}

/**
 * Get count of utilities owned by a player
 */
export function getUtilityCount (custodianId: string, properties: Property[]): number {
  const utilityIds = PROPERTY_GROUPS.utility.properties
  return utilityIds.filter((spaceId) => {
    const property = properties.find((p) => p.spaceId === spaceId)
    return property?.custodianId === custodianId
  }).length
}
