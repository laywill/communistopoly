import { BoardSpace } from '../types/game'

export const BOARD_SPACES: BoardSpace[] = [
  // Position 0 - Corner: STOY (GO)
  {
    id: 0,
    name: 'STOY',
    russianName: 'СТОЙ',
    type: 'corner',
    specialRule: 'Pay ₽200 when passing. Land exactly: roll 4-6 to pilfer ₽100, 1-3 go to Gulag'
  },

  // Position 1 - Brown Property
  {
    id: 1,
    name: 'Camp Vorkuta',
    type: 'property',
    group: 'siberian',
    baseQuota: 2,
    baseCost: 60
  },

  // Position 2 - Communist Test
  {
    id: 2,
    name: 'Communist Test',
    type: 'card',
    cardType: 'communist-test'
  },

  // Position 3 - Brown Property
  {
    id: 3,
    name: 'Camp Kolyma',
    type: 'property',
    group: 'siberian',
    baseQuota: 4,
    baseCost: 60,
    specialRule: 'Both Siberian camps: May send ONE player to Gulag per game (Stalin must approve)'
  },

  // Position 4 - Tax
  {
    id: 4,
    name: 'Revolutionary Contribution',
    type: 'tax',
    specialRule: 'Pay 15% of total wealth OR ₽200. Stalin may audit - pay difference + ₽50 penalty if chose lower'
  },

  // Position 5 - Railway
  {
    id: 5,
    name: 'Moscow Station',
    type: 'railway',
    group: 'railroad',
    baseCost: 200
  },

  // Position 6 - Light Blue Property
  {
    id: 6,
    name: 'Kolkhoz Sunrise',
    type: 'property',
    group: 'collective',
    baseQuota: 6,
    baseCost: 100,
    specialRule: 'Custodian must announce "The harvest is bountiful!" when collecting quota. Failure = halved quota'
  },

  // Position 7 - Party Directive
  {
    id: 7,
    name: 'Party Directive',
    type: 'card',
    cardType: 'party-directive'
  },

  // Position 8 - Light Blue Property
  {
    id: 8,
    name: 'Kolkhoz Progress',
    type: 'property',
    group: 'collective',
    baseQuota: 6,
    baseCost: 100
  },

  // Position 9 - Light Blue Property
  {
    id: 9,
    name: 'Kolkhoz Victory',
    type: 'property',
    group: 'collective',
    baseQuota: 8,
    baseCost: 120
  },

  // Position 10 - Corner: THE GULAG
  {
    id: 10,
    name: 'The Gulag',
    russianName: 'ГУЛАГ',
    type: 'corner',
    specialRule: 'Just visiting or serving sentence'
  },

  // Position 11 - Pink Property
  {
    id: 11,
    name: 'Tractor Factory #47',
    type: 'property',
    group: 'industrial',
    baseQuota: 10,
    baseCost: 140,
    specialRule: 'If player cannot pay, they work off debt by missing next turn'
  },

  // Position 12 - Utility
  {
    id: 12,
    name: 'State Electricity Board',
    type: 'utility',
    group: 'utility',
    baseCost: 150,
    specialRule: 'Payment: 4× dice if one utility, 10× dice if both. COMMISSAR+ rank only'
  },

  // Position 13 - Pink Property
  {
    id: 13,
    name: 'Steel Mill Molotov',
    type: 'property',
    group: 'industrial',
    baseQuota: 10,
    baseCost: 140
  },

  // Position 14 - Pink Property
  {
    id: 14,
    name: 'Munitions Plant Kalashnikov',
    type: 'property',
    group: 'industrial',
    baseQuota: 12,
    baseCost: 160
  },

  // Position 15 - Railway
  {
    id: 15,
    name: 'Novosibirsk Station',
    type: 'railway',
    group: 'railroad',
    baseCost: 200
  },

  // Position 16 - Orange Property
  {
    id: 16,
    name: 'Ministry of Truth',
    type: 'property',
    group: 'ministry',
    baseQuota: 14,
    baseCost: 180,
    specialRule: 'Custodian of all three: May rewrite ONE rule per game (Stalin has veto)'
  },

  // Position 17 - Communist Test
  {
    id: 17,
    name: 'Communist Test',
    type: 'card',
    cardType: 'communist-test'
  },

  // Position 18 - Orange Property
  {
    id: 18,
    name: 'Ministry of Plenty',
    type: 'property',
    group: 'ministry',
    baseQuota: 14,
    baseCost: 180
  },

  // Position 19 - Orange Property
  {
    id: 19,
    name: 'Ministry of Love',
    type: 'property',
    group: 'ministry',
    baseQuota: 16,
    baseCost: 200
  },

  // Position 20 - Corner: BREADLINE
  {
    id: 20,
    name: 'Breadline',
    russianName: 'ОЧЕРЕДЬ',
    type: 'corner',
    specialRule: 'All players must give you one item (₽50, property, or favour). Refusal = denouncement'
  },

  // Position 21 - Red Property
  {
    id: 21,
    name: 'Red Army Barracks',
    type: 'property',
    group: 'military',
    baseQuota: 18,
    baseCost: 220
  },

  // Position 22 - Party Directive
  {
    id: 22,
    name: 'Party Directive',
    type: 'card',
    cardType: 'party-directive'
  },

  // Position 23 - Red Property
  {
    id: 23,
    name: 'KGB Headquarters',
    type: 'property',
    group: 'military',
    baseQuota: 18,
    baseCost: 220,
    specialRule: 'Custodian may look at one Communist Test card before anyone draws it, once per round'
  },

  // Position 24 - Red Property
  {
    id: 24,
    name: 'Nuclear Bunker Arzamas-16',
    type: 'property',
    group: 'military',
    baseQuota: 20,
    baseCost: 240
  },

  // Position 25 - Railway
  {
    id: 25,
    name: 'Irkutsk Station',
    type: 'railway',
    group: 'railroad',
    baseCost: 200
  },

  // Position 26 - Yellow Property
  {
    id: 26,
    name: 'Pravda Printing Press',
    type: 'property',
    group: 'media',
    baseQuota: 22,
    baseCost: 260,
    specialRule: 'Custodian: Spread propaganda once per game - force re-vote on Stalin decision'
  },

  // Position 27 - Yellow Property
  {
    id: 27,
    name: 'Radio Moscow',
    type: 'property',
    group: 'media',
    baseQuota: 22,
    baseCost: 260
  },

  // Position 28 - Utility
  {
    id: 28,
    name: "People's Water Collective",
    type: 'utility',
    group: 'utility',
    baseCost: 150,
    specialRule: 'Payment: 4× dice if one utility, 10× dice if both. COMMISSAR+ rank only'
  },

  // Position 29 - Yellow Property
  {
    id: 29,
    name: 'State Television Center',
    type: 'property',
    group: 'media',
    baseQuota: 22,
    baseCost: 280
  },

  // Position 30 - Corner: ENEMY OF THE STATE
  {
    id: 30,
    name: 'Enemy of the State',
    russianName: 'ВРАГ НАРОДА',
    type: 'corner',
    specialRule: 'Go directly to Gulag. Do not pass Stoy. Lose one Party Rank'
  },

  // Position 31 - Green Property
  {
    id: 31,
    name: 'Politburo Apartments',
    type: 'property',
    group: 'elite',
    baseQuota: 26,
    baseCost: 300,
    specialRule: 'Only PARTY MEMBER+ rank may become Custodian. Lower ranks pay double + must salute'
  },

  // Position 32 - Green Property
  {
    id: 32,
    name: 'Dachas of the Nomenklatura',
    type: 'property',
    group: 'elite',
    baseQuota: 26,
    baseCost: 300
  },

  // Position 33 - Communist Test
  {
    id: 33,
    name: 'Communist Test',
    type: 'card',
    cardType: 'communist-test'
  },

  // Position 34 - Green Property
  {
    id: 34,
    name: 'The Lubyanka',
    type: 'property',
    group: 'elite',
    baseQuota: 28,
    baseCost: 320
  },

  // Position 35 - Railway
  {
    id: 35,
    name: 'Vladivostok Station',
    type: 'railway',
    group: 'railroad',
    baseCost: 200,
    specialRule: 'All four stations: Transport any player to Gulag once per game (attempting to flee)'
  },

  // Position 36 - Party Directive
  {
    id: 36,
    name: 'Party Directive',
    type: 'card',
    cardType: 'party-directive'
  },

  // Position 37 - Dark Blue Property
  {
    id: 37,
    name: "Lenin's Mausoleum",
    type: 'property',
    group: 'kremlin',
    baseQuota: 35,
    baseCost: 350,
    specialRule: 'Only INNER CIRCLE rank. Immune to ONE denouncement per game (Lenin protects you)'
  },

  // Position 38 - Tax
  {
    id: 38,
    name: 'Bourgeois Decadence Tax',
    type: 'tax',
    specialRule: 'Pay ₽100. If wealthiest player, pay ₽200 and lose one rank for capitalist tendencies'
  },

  // Position 39 - Dark Blue Property
  {
    id: 39,
    name: "Stalin's Private Office",
    type: 'property',
    group: 'kremlin',
    baseQuota: 50,
    baseCost: 400,
    specialRule: 'Only INNER CIRCLE rank. Custodian may whisper privately with Stalin once per round'
  }
]

// Helper functions
export function getSpaceById (id: number): BoardSpace | undefined {
  return BOARD_SPACES.find(space => space.id === id)
}

export function getSpacesByType (type: BoardSpace['type']): BoardSpace[] {
  return BOARD_SPACES.filter(space => space.type === type)
}

export function getSpacesByGroup (group: BoardSpace['group']): BoardSpace[] {
  return BOARD_SPACES.filter(space => space.group === group)
}

export function getPropertiesByGroup (group: string): BoardSpace[] {
  return BOARD_SPACES.filter(space => space.type === 'property' && space.group === group)
}
