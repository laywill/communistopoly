<!-- Copyright © 2025 William Lay -->
<!-- Licensed under the PolyForm Noncommercial License 1.0.0 -->

# Communistopoly Technical Specification
## A Guide for Building the Digital Implementation

---

# 1. PROJECT OVERVIEW

Build a shared-screen/hot-seat digital board game based on the Communistopoly rules (a satirical Soviet-themed Monopoly variant). The game runs in a web browser and is designed for 3-6 players gathered around a single screen, with one player acting as "Stalin" (the game master).

**Key Documents to Reference:**
- `communistopoly-rules.md` - Complete game rules and mechanics
- `communistopoly-design.md` - Visual design specification with colors, typography, layouts

---

# 2. TECHNOLOGY STACK

```
Framework:      React 18+ with TypeScript
Bundler:        Vite 5+
Styling:        CSS Modules or Tailwind CSS
State:          React Context + useReducer (or Zustand for simplicity)
Fonts:          Google Fonts
Audio:          Howler.js (optional, for sound effects)
Testing:        Vitest + React Testing Library
```

**Why this stack:**
- Vite provides fast HMR and simple configuration
- TypeScript catches errors early in complex game logic
- No backend needed - all state is client-side for shared-screen play
- Can be containerized and served as static files

---

# 3. PROJECT STRUCTURE

```
communistopoly/
├── .devcontainer/
│   └── devcontainer.json
├── Dockerfile
├── docker-compose.yml
├── public/
│   ├── fonts/
│   ├── sounds/
│   └── images/
│       ├── pieces/          # Player piece SVGs
│       ├── icons/           # UI icons
│       └── decorations/     # Soviet decorative elements
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   │
│   ├── components/
│   │   ├── Board/
│   │   │   ├── Board.tsx
│   │   │   ├── Board.module.css
│   │   │   ├── BoardSpace.tsx
│   │   │   ├── CornerSpace.tsx
│   │   │   ├── PropertySpace.tsx
│   │   │   ├── RailroadSpace.tsx
│   │   │   ├── UtilitySpace.tsx
│   │   │   ├── CardSpace.tsx
│   │   │   ├── TaxSpace.tsx
│   │   │   └── CenterArea.tsx
│   │   │
│   │   ├── PlayerDashboard/
│   │   │   ├── PlayerDashboard.tsx
│   │   │   ├── PlayerCard.tsx
│   │   │   ├── PlayerCardExpanded.tsx
│   │   │   ├── PlayerCardCompact.tsx
│   │   │   └── GulagStatus.tsx
│   │   │
│   │   ├── StalinPanel/
│   │   │   ├── StalinPanel.tsx
│   │   │   ├── TribunalControls.tsx
│   │   │   ├── RankControls.tsx
│   │   │   ├── GulagControls.tsx
│   │   │   └── SpecialDecrees.tsx
│   │   │
│   │   ├── Modals/
│   │   │   ├── Modal.tsx              # Base modal component
│   │   │   ├── TribunalModal.tsx
│   │   │   ├── CommunistTestModal.tsx
│   │   │   ├── PropertyModal.tsx
│   │   │   ├── PartyDirectiveModal.tsx
│   │   │   ├── DenounceModal.tsx
│   │   │   └── ConfirmationModal.tsx
│   │   │
│   │   ├── Dice/
│   │   │   ├── Dice.tsx
│   │   │   └── Dice.module.css
│   │   │
│   │   ├── Cards/
│   │   │   ├── PropertyCard.tsx
│   │   │   ├── PartyDirectiveCard.tsx
│   │   │   └── CommunistTestCard.tsx
│   │   │
│   │   ├── GameLog/
│   │   │   └── GameLog.tsx
│   │   │
│   │   └── UI/
│   │       ├── Button.tsx
│   │       ├── RankStars.tsx
│   │       ├── RubleDisplay.tsx
│   │       └── Timer.tsx
│   │
│   ├── screens/
│   │   ├── WelcomeScreen.tsx
│   │   ├── SetupScreen.tsx
│   │   ├── GameScreen.tsx
│   │   └── EndScreen.tsx
│   │
│   ├── game/
│   │   ├── gameReducer.ts       # Main game state reducer
│   │   ├── gameActions.ts       # Action creators
│   │   ├── gameContext.tsx      # React context provider
│   │   ├── gameTypes.ts         # TypeScript interfaces
│   │   ├── boardData.ts         # Board space definitions
│   │   ├── cardDecks.ts         # Card definitions
│   │   ├── pieceAbilities.ts    # Player piece special rules
│   │   └── spaceHandlers.ts     # Logic for landing on spaces
│   │
│   ├── utils/
│   │   ├── diceRoll.ts
│   │   ├── calculations.ts
│   │   └── formatters.ts
│   │
│   └── styles/
│       ├── variables.css        # CSS custom properties
│       ├── typography.css
│       └── soviet-theme.css
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

# 4. BOARD RENDERING - THE CRITICAL ELEMENT

The Monopoly-style board is the trickiest visual element. Here's how to implement it properly:

## 4.1 Board Layout Strategy

The board is a **square grid** with:
- 4 corner spaces (larger, 100x100px base)
- 9 spaces per edge between corners (60x100px base)
- Total: 40 spaces (4 corners + 36 edge spaces)

**Use CSS Grid for the outer ring:**

```tsx
// Board.tsx
import styles from './Board.module.css';

export const Board: React.FC = () => {
  return (
    <div className={styles.board}>
      <div className={styles.boardRing}>
        {/* Top row: 11 spaces (corner + 9 + corner) */}
        <div className={styles.topRow}>
          <CornerSpace type="breadline" /> {/* Top-left */}
          {topEdgeSpaces.map(space => <BoardSpace key={space.id} {...space} />)}
          <CornerSpace type="enemy-of-state" /> {/* Top-right */}
        </div>
        
        {/* Middle section: left column + center + right column */}
        <div className={styles.middleSection}>
          <div className={styles.leftColumn}>
            {leftEdgeSpaces.map(space => <BoardSpace key={space.id} {...space} />)}
          </div>
          
          <div className={styles.centerArea}>
            <CenterArea />
          </div>
          
          <div className={styles.rightColumn}>
            {rightEdgeSpaces.map(space => <BoardSpace key={space.id} {...space} />)}
          </div>
        </div>
        
        {/* Bottom row: 11 spaces */}
        <div className={styles.bottomRow}>
          <CornerSpace type="gulag" /> {/* Bottom-left */}
          {bottomEdgeSpaces.map(space => <BoardSpace key={space.id} {...space} />)}
          <CornerSpace type="stoy" /> {/* Bottom-right */}
        </div>
      </div>
    </div>
  );
};
```

## 4.2 Board CSS Structure

```css
/* Board.module.css */

.board {
  --space-width: 60px;
  --space-height: 100px;
  --corner-size: 100px;
  --board-size: calc((var(--space-width) * 9) + (var(--corner-size) * 2));
  
  width: var(--board-size);
  height: var(--board-size);
  background: var(--color-parchment);
  border: 8px solid var(--color-soviet-red);
  box-shadow: inset 0 0 0 2px var(--color-kremlin-gold);
  position: relative;
}

.boardRing {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.topRow,
.bottomRow {
  display: flex;
  height: var(--corner-size);
}

.middleSection {
  display: flex;
  flex: 1;
}

.leftColumn,
.rightColumn {
  display: flex;
  flex-direction: column;
  width: var(--corner-size);
}

/* Rotate spaces to face inward */
.leftColumn {
  flex-direction: column-reverse;
}

.leftColumn .space {
  transform: rotate(90deg);
  transform-origin: center;
}

.rightColumn .space {
  transform: rotate(-90deg);
  transform-origin: center;
}

.topRow .space:not(.corner) {
  transform: rotate(180deg);
}

.centerArea {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

## 4.3 Space Indexing System

Use a consistent indexing system matching real Monopoly boards:

```typescript
// boardData.ts

export enum SpacePosition {
  // Bottom row (right to left, starting from STOY)
  STOY = 0,
  CAMP_VORKUTA = 1,
  COMMUNIST_TEST_1 = 2,
  CAMP_KOLYMA = 3,
  REVOLUTIONARY_CONTRIBUTION = 4,
  MOSCOW_STATION = 5,
  KOLKHOZ_SUNRISE = 6,
  PARTY_DIRECTIVE_1 = 7,
  KOLKHOZ_PROGRESS = 8,
  KOLKHOZ_VICTORY = 9,
  
  // Left column (bottom to top)
  GULAG = 10,
  TRACTOR_FACTORY = 11,
  STATE_ELECTRICITY = 12,
  STEEL_MILL = 13,
  MUNITIONS_PLANT = 14,
  NOVOSIBIRSK_STATION = 15,
  MINISTRY_TRUTH = 16,
  COMMUNIST_TEST_2 = 17,
  MINISTRY_PLENTY = 18,
  MINISTRY_LOVE = 19,
  
  // Top row (left to right)
  BREADLINE = 20,
  RED_ARMY_BARRACKS = 21,
  PARTY_DIRECTIVE_2 = 22,
  KGB_HEADQUARTERS = 23,
  NUCLEAR_BUNKER = 24,
  IRKUTSK_STATION = 25,
  PRAVDA_PRESS = 26,
  RADIO_MOSCOW = 27,
  PEOPLES_WATER = 28,
  STATE_TV = 29,
  
  // Right column (top to bottom)
  ENEMY_OF_STATE = 30,
  POLITBURO_APARTMENTS = 31,
  DACHAS_NOMENKLATURA = 32,
  COMMUNIST_TEST_3 = 33,
  THE_LUBYANKA = 34,
  VLADIVOSTOK_STATION = 35,
  PARTY_DIRECTIVE_3 = 36,
  LENINS_MAUSOLEUM = 37,
  BOURGEOIS_TAX = 38,
  STALINS_OFFICE = 39,
}

export interface BoardSpaceData {
  id: SpacePosition;
  name: string;
  russianName?: string;
  type: 'property' | 'railroad' | 'utility' | 'tax' | 'card' | 'corner';
  group?: PropertyGroup;
  baseQuota?: number;
  baseCost?: number;
  specialRule?: string;
}

export const BOARD_SPACES: BoardSpaceData[] = [
  {
    id: SpacePosition.STOY,
    name: "STOY",
    russianName: "СТОЙ",
    type: 'corner',
    specialRule: "Pay ₽200 when passing. Land exactly: roll 4-6 to pilfer ₽100, 1-3 go to Gulag"
  },
  {
    id: SpacePosition.CAMP_VORKUTA,
    name: "Camp Vorkuta",
    type: 'property',
    group: 'siberian',
    baseQuota: 20,
    baseCost: 60,
  },
  // ... define all 40 spaces
];
```

## 4.4 Property Space Component

```tsx
// PropertySpace.tsx
import { BoardSpaceData, PropertyGroup } from '../../game/gameTypes';
import styles from './Board.module.css';

const GROUP_COLORS: Record<PropertyGroup, string> = {
  siberian: '#8B6914',
  collective: '#87CEEB',
  industrial: '#DB7093',
  ministry: '#E86D1F',
  military: '#C41E3A',
  media: '#F4D03F',
  elite: '#228B22',
  kremlin: '#1C3A5F',
};

interface PropertySpaceProps {
  space: BoardSpaceData;
  custodian?: Player | null;
  collectivizationLevel: number;
  playersOnSpace: Player[];
}

export const PropertySpace: React.FC<PropertySpaceProps> = ({
  space,
  custodian,
  collectivizationLevel,
  playersOnSpace,
}) => {
  return (
    <div className={styles.propertySpace}>
      {/* Color band at top */}
      <div 
        className={styles.colorBand}
        style={{ backgroundColor: GROUP_COLORS[space.group!] }}
      />
      
      {/* Property name */}
      <div className={styles.propertyName}>
        {space.name}
      </div>
      
      {/* Quota display */}
      <div className={styles.quota}>
        ₽{space.baseQuota}
      </div>
      
      {/* Collectivization indicators */}
      <div className={styles.collectivization}>
        {Array.from({ length: 5 }).map((_, i) => (
          <span 
            key={i} 
            className={i < collectivizationLevel ? styles.filled : styles.empty}
          >
            {i < 4 ? '☆' : '★'}
          </span>
        ))}
      </div>
      
      {/* Player tokens */}
      <div className={styles.playerTokens}>
        {playersOnSpace.map(player => (
          <PlayerToken key={player.id} player={player} />
        ))}
      </div>
      
      {/* Custodian indicator */}
      {custodian && (
        <div className={styles.custodianBadge}>
          {custodian.piece.icon}
        </div>
      )}
    </div>
  );
};
```

---

# 5. GAME STATE ARCHITECTURE

## 5.1 Core Types

```typescript
// gameTypes.ts

export type PartyRank = 'proletariat' | 'party-member' | 'commissar' | 'inner-circle';

export type PieceType = 
  | 'hammer' | 'sickle' | 'red-star' | 'tank' 
  | 'bread-loaf' | 'iron-curtain' | 'vodka-bottle' | 'lenin-statue';

export type PropertyGroup = 
  | 'siberian' | 'collective' | 'industrial' | 'ministry'
  | 'military' | 'media' | 'elite' | 'kremlin' | 'railroad' | 'utility';

export interface Player {
  id: string;
  name: string;
  piece: PieceType;
  position: number;           // Board position (0-39)
  rubles: number;
  rank: PartyRank;
  isInGulag: boolean;
  gulagTurns: number;         // Turns spent in gulag
  isEliminated: boolean;
  isGhost: boolean;           // Eliminated but can still observe
  communistTestStreak: number; // For tracking 2 failures in a row
  immunities: {
    denouncement: boolean;    // Lenin's Mausoleum protection
    gulag: boolean;           // Tank's first gulag immunity
  };
  vouchingFor: string | null; // Player ID they vouched for
  underSuspicion: boolean;    // Next denouncement needs no witnesses
}

export interface Property {
  spaceId: number;
  custodianId: string | null;
  collectivizationLevel: number; // 0-5 (0=none, 5=People's Palace)
}

export interface GameState {
  phase: GamePhase;
  players: Player[];
  stalinId: string;           // Stalin doesn't play, just controls
  currentPlayerId: string;
  properties: Property[];
  
  // Dice state
  dice: [number, number];
  doublesCount: number;
  hasRolled: boolean;
  
  // Turn tracking
  turnNumber: number;
  roundNumber: number;
  
  // Active modals/events
  activeModal: ModalType | null;
  pendingAction: PendingAction | null;
  
  // Tribunal state
  tribunal: TribunalState | null;
  
  // Game log
  log: LogEntry[];
  
  // Optional rules
  optionalRules: {
    secretPolice: boolean;
    fiveYearPlans: boolean;
    greatPurge: boolean;
    rehabilitation: boolean;
    personalityCult: boolean;
  };
  
  // Secret police (if enabled)
  kgbInformantId: string | null;
}

export type GamePhase = 
  | 'setup'
  | 'pre-roll'           // Before dice roll
  | 'rolling'            // Dice animation
  | 'moving'             // Piece movement animation
  | 'resolving-space'    // Landed on space, resolving effects
  | 'post-roll'          // Can denounce, trade, improve
  | 'tribunal'           // Tribunal in progress
  | 'communist-test'     // Answering a test question
  | 'gulag-turn'         // Player in gulag taking their turn
  | 'game-over';

export interface TribunalState {
  accuserId: string;
  accusedId: string;
  crime: string;
  phase: 'accusation' | 'defence' | 'witnesses' | 'judgement';
  witnesses: { playerId: string; forDefence: boolean }[];
  timerSeconds: number;
}
```

## 5.2 Game Reducer Structure

```typescript
// gameReducer.ts

export type GameAction =
  | { type: 'START_GAME'; players: PlayerSetup[] }
  | { type: 'ROLL_DICE' }
  | { type: 'DICE_RESULT'; dice: [number, number] }
  | { type: 'MOVE_PLAYER'; playerId: string; newPosition: number }
  | { type: 'RESOLVE_SPACE'; spaceId: number }
  | { type: 'PURCHASE_PROPERTY'; playerId: string; spaceId: number; price: number }
  | { type: 'DECLINE_PROPERTY' }
  | { type: 'PAY_QUOTA'; payerId: string; amount: number; custodianId: string }
  | { type: 'IMPROVE_PROPERTY'; spaceId: number }
  | { type: 'START_DENOUNCEMENT'; accuserId: string; accusedId: string; crime: string }
  | { type: 'TRIBUNAL_VERDICT'; verdict: TribunalVerdict }
  | { type: 'SEND_TO_GULAG'; playerId: string; reason: string }
  | { type: 'ESCAPE_GULAG'; playerId: string; method: GulagEscapeMethod }
  | { type: 'CHANGE_RANK'; playerId: string; newRank: PartyRank; reason: string }
  | { type: 'COMMUNIST_TEST_ANSWER'; correct: boolean }
  | { type: 'STALIN_ACTION'; action: StalinAction }
  | { type: 'END_TURN' }
  | { type: 'ELIMINATE_PLAYER'; playerId: string; reason: string }
  | { type: 'END_GAME'; reason: string };

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'ROLL_DICE':
      return {
        ...state,
        phase: 'rolling',
        hasRolled: true,
      };
      
    case 'DICE_RESULT': {
      const [d1, d2] = action.dice;
      const isDoubles = d1 === d2;
      const newDoublesCount = isDoubles ? state.doublesCount + 1 : 0;
      
      // Three doubles = counter-revolutionary behavior
      if (newDoublesCount >= 3) {
        return {
          ...state,
          dice: action.dice,
          doublesCount: 0,
          phase: 'resolving-space',
          pendingAction: { type: 'send-to-gulag', reason: 'Counter-revolutionary dice behavior' },
        };
      }
      
      return {
        ...state,
        dice: action.dice,
        doublesCount: newDoublesCount,
        phase: 'moving',
      };
    }
    
    // ... implement all action handlers
    
    default:
      return state;
  }
}
```

---

# 6. STALIN'S CONTROL PANEL

Stalin has a special interface that differs from regular players:

```tsx
// StalinPanel.tsx

export const StalinPanel: React.FC = () => {
  const { state, dispatch } = useGame();
  
  return (
    <div className={styles.stalinPanel}>
      <header className={styles.header}>
        <span className={styles.star}>☭</span>
        <h1>КРЕМЛЬ KREMLIN</h1>
        <h2>COMMAND CENTER</h2>
        <span className={styles.star}>☭</span>
      </header>
      
      <div className={styles.treasury}>
        STATE TREASURY: ₽{calculateStateTreasury(state)}
        <button onClick={() => openAuditModal()}>AUDIT PLAYER ▼</button>
      </div>
      
      <div className={styles.controlGrid}>
        <section className={styles.tribunals}>
          <h3>TRIBUNALS</h3>
          <Button onClick={holdTribunal}>HOLD TRIBUNAL</Button>
          <Button onClick={viewActive}>VIEW ACTIVE</Button>
        </section>
        
        <section className={styles.rankControl}>
          <h3>RANK CONTROL</h3>
          <Button onClick={promotePlayer}>PROMOTE PLAYER</Button>
          <Button onClick={demotePlayer}>DEMOTE PLAYER</Button>
          <Button variant="danger" onClick={sendToGulag}>SEND TO GULAG</Button>
          <Button variant="danger" onClick={executePlayer}>EXECUTE</Button>
        </section>
        
        <section className={styles.gulagControl}>
          <h3>GULAG CONTROL</h3>
          <Button onClick={manageInmates}>MANAGE INMATES</Button>
          <Button onClick={acceptBribe}>ACCEPT BRIBE (₽200+?)</Button>
        </section>
        
        <section className={styles.specialDecrees}>
          <h3>SPECIAL DECREES</h3>
          <Button onClick={theGreatPurge}>THE GREAT PURGE</Button>
          <Button onClick={fiveYearPlan}>FIVE-YEAR PLAN</Button>
          <Button onClick={heroOfSovietUnion}>HERO OF SOVIET UNION</Button>
          <Button onClick={setPropertyPrice}>SET PROPERTY PRICE</Button>
        </section>
      </div>
      
      {state.pendingBribes.length > 0 && (
        <div className={styles.bribesNotice}>
          BRIBES PENDING: {state.pendingBribes.length}
          <Button onClick={viewBribes}>VIEW BRIBES</Button>
        </div>
      )}
    </div>
  );
};
```

---

# 7. KEY GAME MECHANICS IMPLEMENTATION

## 7.1 Passing/Landing on STOY (GO)

```typescript
// spaceHandlers.ts

export function handleStoy(
  state: GameState, 
  player: Player, 
  passedThrough: boolean
): GameState {
  if (passedThrough) {
    // Passing through: pay travel tax
    return {
      ...state,
      players: updatePlayer(state.players, player.id, {
        rubles: player.rubles - 200,
      }),
      log: [...state.log, {
        type: 'payment',
        message: `${player.name} paid ₽200 travel tax at STOY`,
      }],
    };
  } else {
    // Landed exactly: attempt to pilfer
    return {
      ...state,
      phase: 'resolving-space',
      pendingAction: { type: 'stoy-pilfer' },
      activeModal: 'stoy-pilfer',
    };
  }
}

export function resolvePilfer(state: GameState, diceRoll: number): GameState {
  const player = getCurrentPlayer(state);
  
  if (diceRoll >= 4) {
    // Success! Steal 100 from state
    return {
      ...state,
      players: updatePlayer(state.players, player.id, {
        rubles: player.rubles + 100,
      }),
      log: [...state.log, {
        type: 'pilfer-success',
        message: `${player.name} successfully pilfered ₽100 from the State!`,
      }],
      pendingAction: null,
      activeModal: null,
    };
  } else {
    // Caught! Go to gulag
    return sendToGulag(state, player.id, 'Caught pilfering at checkpoint');
  }
}
```

## 7.2 Gulag Escape Logic

```typescript
// gulagLogic.ts

export function getRequiredDoublesForEscape(turnsInGulag: number): number[] {
  switch (turnsInGulag) {
    case 1: return [6, 6];           // Need double 6s
    case 2: return [5, 5, 6, 6];     // Double 5s or 6s
    case 3: return [4, 4, 5, 5, 6, 6];
    case 4: return [3, 3, 4, 4, 5, 5, 6, 6];
    default: return [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6]; // Any doubles
  }
}

export function canEscapeWithRoll(dice: [number, number], turnsInGulag: number): boolean {
  if (dice[0] !== dice[1]) return false; // Must be doubles
  
  const requiredDoubles = getRequiredDoublesForEscape(turnsInGulag);
  return requiredDoubles.includes(dice[0]);
}

export type GulagEscapeMethod = 
  | { type: 'roll'; dice: [number, number] }
  | { type: 'pay' }  // 500 rubles, lose rank
  | { type: 'vouch'; voucherId: string }
  | { type: 'inform'; targetId: string; crime: string }
  | { type: 'bribe'; amount: number };  // Stalin accepts/rejects
```

## 7.3 Denouncement System

```typescript
// tribunalLogic.ts

export const CRIMES = [
  "Counter-revolutionary activities",
  "Capitalist sympathies",
  "Hoarding resources",
  "Insufficient enthusiasm",
  "Suspicious behavior",
  "Being too successful",
  "Being too unsuccessful",
  "Having a suspicious look",
  "Not having a suspicious enough look",
  "\"You know what you did\"",
];

export function canDenounce(state: GameState, accuserId: string, accusedId: string): {
  allowed: boolean;
  reason?: string;
} {
  const accuser = getPlayer(state, accuserId);
  const accused = getPlayer(state, accusedId);
  
  // Cannot denounce someone in gulag
  if (accused.isInGulag) {
    return { allowed: false, reason: "Cannot denounce someone already in the Gulag" };
  }
  
  // Cannot denounce Stalin
  if (accusedId === state.stalinId) {
    return { allowed: false, reason: "Denouncing Stalin is itself a crime!" };
  }
  
  // Check denouncement limits (once per round unless Commissar+)
  const hasDenouncedThisRound = state.denouncementsThisRound.includes(accuserId);
  if (hasDenouncedThisRound && getRankLevel(accuser.rank) < 2) {
    return { allowed: false, reason: "You may only denounce once per round" };
  }
  
  return { allowed: true };
}

export function getWitnessRequirement(accused: Player): number {
  switch (accused.rank) {
    case 'proletariat': return 0;  // No witnesses needed
    case 'party-member': return 1;
    case 'commissar': return 2;
    case 'inner-circle': return Infinity; // Unanimous + Stalin approval
    default: return 0;
  }
}
```

## 7.4 Communist Test Questions

```typescript
// cardDecks.ts

export interface CommunistTestCard {
  id: string;
  question: string;
  answer: string;
  acceptableAnswers?: string[];  // Alternative accepted answers
  difficulty: 'easy' | 'medium' | 'hard' | 'trick';
  reward: number;
  penalty: number;
  grantsRankUp?: boolean;
}

export const COMMUNIST_TEST_DECK: CommunistTestCard[] = [
  // Easy questions
  {
    id: 'easy-1',
    question: "What does USSR stand for?",
    answer: "Union of Soviet Socialist Republics",
    acceptableAnswers: ["union of soviet socialist republics", "ussr"],
    difficulty: 'easy',
    reward: 100,
    penalty: 0,
  },
  {
    id: 'easy-2',
    question: "Who wrote The Communist Manifesto?",
    answer: "Karl Marx and Friedrich Engels",
    acceptableAnswers: ["marx", "marx and engels", "karl marx"],
    difficulty: 'easy',
    reward: 100,
    penalty: 0,
  },
  // ... more questions from the rules document
  
  // Trick questions (Stalin decides)
  {
    id: 'trick-1',
    question: "Was communism successful?",
    answer: "Communism is always successful, Comrade Stalin.",
    difficulty: 'trick',
    reward: 0,  // Stalin decides
    penalty: 0,
  },
  {
    id: 'trick-2',
    question: "Who is the greatest leader in history?",
    answer: "Stalin",
    difficulty: 'trick',
    reward: 0,
    penalty: 0,
  },
];
```

---

# 8. PLAYER PIECES AND ABILITIES

```typescript
// pieceAbilities.ts

export interface PieceDefinition {
  type: PieceType;
  name: string;
  quote: string;
  icon: string;  // Emoji or SVG reference
  abilities: PieceAbility[];
  restrictions: PieceRestriction[];
}

export const PIECES: PieceDefinition[] = [
  {
    type: 'hammer',
    name: "The Hammer",
    quote: "The worker's tool, building the future",
    icon: "🔨",
    abilities: [
      {
        type: 'passive',
        description: "+₽50 every time you pass Stoy",
        trigger: 'pass-stoy',
        effect: (state, playerId) => ({
          ...state,
          players: updatePlayer(state.players, playerId, {
            rubles: getPlayer(state, playerId).rubles + 50,
          }),
        }),
      },
      {
        type: 'immunity',
        description: "Cannot be sent to Gulag by other players",
        condition: (state, senderId) => senderId !== state.stalinId,
      },
    ],
    restrictions: [
      {
        type: 'must',
        description: "Must always vote 'guilty' in tribunals",
        consequence: "Lose ability for rest of game if violated",
      },
    ],
  },
  {
    type: 'sickle',
    name: "The Sickle",
    quote: "The farmer's blade, reaping the harvest",
    icon: "🌾",  // Closest emoji, or use custom SVG
    abilities: [
      {
        type: 'passive',
        description: "Collective Farm quotas against you are halved",
      },
      {
        type: 'once-per-game',
        description: "Harvest: steal one property worth <₽150",
        used: false,
      },
    ],
    restrictions: [
      {
        type: 'must',
        description: "Must announce 'For the Motherland!' before each roll",
        penalty: 25,
      },
    ],
  },
  // ... define all 8 pieces
];
```

---

# 9. STYLING GUIDE

Based on the design document, implement these CSS custom properties:

```css
/* variables.css */

:root {
  /* Primary Colors */
  --color-soviet-red: #C41E3A;
  --color-kremlin-gold: #D4A84B;
  --color-propaganda-black: #1A1A1A;
  --color-parchment: #F5E6C8;
  --color-aged-white: #FAF6EF;
  
  /* Secondary Colors */
  --color-gulag-grey: #4A4A4A;
  --color-steel-blue: #2C3E50;
  --color-military-olive: #4A5D23;
  --color-warning-amber: #B8860B;
  --color-blood-burgundy: #722F37;
  
  /* Property Groups */
  --color-group-siberian: #8B6914;
  --color-group-collective: #87CEEB;
  --color-group-industrial: #DB7093;
  --color-group-ministry: #E86D1F;
  --color-group-military: #C41E3A;
  --color-group-media: #F4D03F;
  --color-group-elite: #228B22;
  --color-group-kremlin: #1C3A5F;
  
  /* Typography */
  --font-display: 'Oswald', 'Bebas Neue', 'Impact', sans-serif;
  --font-body: 'Roboto Condensed', 'Source Sans Pro', 'Arial Narrow', sans-serif;
  --font-mono: 'Roboto Mono', 'Share Tech Mono', 'Courier New', monospace;
  
  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  
  /* Borders */
  --border-standard: 2px solid var(--color-propaganda-black);
  --border-gold: 2px solid var(--color-kremlin-gold);
  --border-soviet: 4px solid var(--color-soviet-red);
}

/* Soviet-style button */
.btn-primary {
  background: linear-gradient(180deg, var(--color-soviet-red) 0%, #8B0000 100%);
  color: var(--color-aged-white);
  border: 2px solid var(--color-kremlin-gold);
  padding: 12px 24px;
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  box-shadow: 0 4px 0 #5C0A1A, 0 6px 10px rgba(0,0,0,0.3);
  cursor: pointer;
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 0 #5C0A1A, 0 8px 15px rgba(0,0,0,0.4);
}

.btn-primary:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 #5C0A1A, 0 3px 5px rgba(0,0,0,0.3);
}
```

---

# 10. DEVCONTAINER & DOCKER SETUP

## 10.1 DevContainer Configuration

```json
// .devcontainer/devcontainer.json
{
  "name": "Communistopoly Dev",
  "image": "mcr.microsoft.com/devcontainers/typescript-node:22",
  "features": {
    "ghcr.io/devcontainers/features/docker-in-docker:2": {}
  },
  "customizations": {
    "vscode": {
      "settings": {
        "editor.formatOnSave": true
      }
    }
  },
  "forwardPorts": [5173],
  "postCreateCommand": "npm install",
  "remoteUser": "node"
}
```

## 10.2 Dockerfile (Multi-stage Production Build)

```dockerfile
# Dockerfile

# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production
FROM nginx:alpine AS production

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

## 10.3 Nginx Configuration

```nginx
# nginx.conf

events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    sendfile        on;
    keepalive_timeout  65;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    server {
        listen       80;
        server_name  localhost;

        root   /usr/share/nginx/html;
        index  index.html;

        # Handle client-side routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

## 10.4 Docker Compose

```yaml
# docker-compose.yml

version: '3.8'

services:
  communistopoly:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8080:80"
    restart: unless-stopped

  # Development service
  dev:
    image: node:22-alpine
    working_dir: /app
    volumes:
      - .:/app
      - node_modules:/app/node_modules
    ports:
      - "5173:5173"
    command: sh -c "npm install && npm run dev -- --host"
    profiles:
      - dev

volumes:
  node_modules:
```

---

# 11. INITIAL PACKAGE.JSON

```json
{
  "name": "communistopoly",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "test": "vitest",
    "test:ui": "vitest --ui"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "howler": "^2.2.4"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "eslint": "^8.57.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.0",
    "typescript": "^5.4.0",
    "vite": "^5.2.0",
    "vitest": "^1.4.0",
    "@vitest/ui": "^1.4.0"
  }
}
```

---

# 12. IMPLEMENTATION PRIORITY ORDER

Build the game in this order for best results:

## Phase 1: Foundation
1. ✅ Project setup (Vite, TypeScript, folder structure)
2. ✅ CSS variables and base styling
3. ✅ Board rendering (the hardest visual part)
4. ✅ Basic player tokens on board

## Phase 2: Core Game Loop
5. Game state context and reducer
6. Dice rolling and movement
7. Turn management
8. Basic space resolution (just landing, no special effects)

## Phase 3: Property System
9. Property data and rendering
10. Custodianship (buying properties)
11. Quota collection (rent equivalent)
12. Collectivization (improvements)

## Phase 4: Stalin & Special Mechanics
13. Stalin control panel
14. Denouncement system
15. Tribunal modal and flow
16. Gulag mechanics

## Phase 5: Cards & Tests
17. Party Directive cards
18. Communist Test system
19. Card deck shuffling and drawing

## Phase 6: Player Pieces
20. Piece selection during setup
21. Individual piece abilities
22. Piece restrictions enforcement

## Phase 7: Win Conditions & Polish
23. Player elimination
24. Victory detection
25. Game log
26. Sound effects (optional)
27. Animations and polish

---

# 13. REFERENCE PATTERNS FROM MONOPOLY REPO

The [itaylayzer/Monopoly repo](https://github.com/itaylayzer/Monopoly) uses these patterns that are worth noting:

1. **Board space data in JSON**: They use a `monopoly.json` file to define all properties. Consider using TypeScript objects instead for better type safety.

2. **CSS for board rotation**: Spaces on left/right columns are rotated 90/-90 degrees to face inward.

3. **Player movement**: Calculate path from current position to new position, animate through each space.

4. **Modal system**: Centralized modal rendering with different modal types.

5. **Turn state machine**: Explicit phases prevent invalid actions.

---

# 14. TESTING STRATEGY

```typescript
// Example test for denouncement logic
// __tests__/tribunalLogic.test.ts

import { describe, it, expect } from 'vitest';
import { canDenounce, getWitnessRequirement } from '../game/tribunalLogic';

describe('Denouncement System', () => {
  it('should not allow denouncing someone in gulag', () => {
    const state = createMockState({
      players: [
        { id: '1', isInGulag: false },
        { id: '2', isInGulag: true },
      ],
    });
    
    const result = canDenounce(state, '1', '2');
    
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Gulag');
  });
  
  it('should require 2 witnesses for commissar rank', () => {
    const player = { rank: 'commissar' as const };
    expect(getWitnessRequirement(player)).toBe(2);
  });
});
```

---

**Glory to the Motherland. Glory to the Code. Glory to Stalin.**

*This specification should be used alongside communistopoly-rules.md and communistopoly-design.md*
