<!-- Copyright © 2025 William Lay -->
<!-- Licensed under the PolyForm Noncommercial License 1.0.0 -->

# Communistopoly Design Document
## Visual Design Specification for Digital Shared-Screen Implementation

---

# 1. DESIGN PHILOSOPHY

The visual design draws from **Soviet Constructivist propaganda art** (1920s-1950s) — bold geometric shapes, limited color palettes, stark contrasts, and heroic imagery. The aesthetic should feel like playing a board game printed on weathered propaganda posters, operated through a bureaucratic state interface.

**Key Principles:**
- **Bold & Authoritarian**: Strong colors, heavy typography, commanding presence
- **Satirically Bureaucratic**: Forms, stamps, official seals, paper textures
- **Nostalgically Worn**: Aged paper, slight distressing, vintage printing effects
- **Darkly Humorous**: The oppressive aesthetic should feel playful, not genuinely threatening

---

# 2. COLOR PALETTE

## Primary Colors

| Name                 | Hex       | RGB           | Usage                                                    |
|----------------------|-----------|---------------|----------------------------------------------------------|
| **Soviet Red**       | `#C41E3A` | 196, 30, 58   | Primary accent, headers, important buttons, board border |
| **Kremlin Gold**     | `#D4A84B` | 212, 168, 75  | Secondary accent, highlights, rank badges, currency      |
| **Propaganda Black** | `#1A1A1A` | 26, 26, 26    | Text, borders, shadows                                   |
| **Parchment Cream**  | `#F5E6C8` | 245, 230, 200 | Backgrounds, card faces, paper elements                  |
| **Aged White**       | `#FAF6EF` | 250, 246, 239 | Lighter backgrounds, contrast areas                      |

## Secondary Colors

| Name               | Hex       | RGB          | Usage                                     |
|--------------------|-----------|--------------|-------------------------------------------|
| **Gulag Grey**     | `#4A4A4A` | 74, 74, 74   | Disabled states, Gulag UI, secondary text |
| **Steel Blue**     | `#2C3E50` | 44, 62, 80   | Stalin's interface, authority elements    |
| **Military Olive** | `#4A5D23` | 74, 93, 35   | Success states, positive feedback         |
| **Warning Amber**  | `#B8860B` | 184, 134, 11 | Warnings, caution states                  |
| **Blood Burgundy** | `#722F37` | 114, 47, 55  | Danger, elimination, negative states      |

## Property Group Colors

| Group                          | Background | Border/Accent | Text      |
|--------------------------------|------------|---------------|-----------|
| Siberian Work Camps (Brown)    | `#8B6914`  | `#5D4E37`     | `#FAF6EF` |
| Collective Farms (Light Blue)  | `#87CEEB`  | `#5F9EA0`     | `#1A1A1A` |
| Industrial Centers (Pink)      | `#DB7093`  | `#C71585`     | `#FAF6EF` |
| Government Ministries (Orange) | `#E86D1F`  | `#CC5500`     | `#FAF6EF` |
| Military Installations (Red)   | `#C41E3A`  | `#8B0000`     | `#FAF6EF` |
| State Media (Yellow)           | `#F4D03F`  | `#D4A84B`     | `#1A1A1A` |
| Party Elite District (Green)   | `#228B22`  | `#006400`     | `#FAF6EF` |
| Kremlin Complex (Dark Blue)    | `#1C3A5F`  | `#0D2137`     | `#D4A84B` |
| Railways                       | `#1A1A1A`  | `#C41E3A`     | `#FAF6EF` |
| Utilities                      | `#F5E6C8`  | `#1A1A1A`     | `#1A1A1A` |

---

# 3. TYPOGRAPHY

## Font Stack

### Display/Headers: "Oswald" or "Bebas Neue"
- Soviet poster-style condensed sans-serif
- Use for: Game title, section headers, player names, property names
- Always UPPERCASE for major headers
- Letter-spacing: 0.05em for headers, 0.1em for titles

```css
font-family: 'Oswald', 'Bebas Neue', 'Impact', sans-serif;
```

### Body/UI: "Roboto Condensed" or "Source Sans Pro"
- Clean, readable, slightly industrial
- Use for: Body text, buttons, form labels, game log

```css
font-family: 'Roboto Condensed', 'Source Sans Pro', 'Arial Narrow', sans-serif;
```

### Monospace/Numbers: "Roboto Mono" or "Share Tech Mono"
- For currency displays, dice rolls, timers
- Industrial/typewriter feel

```css
font-family: 'Roboto Mono', 'Share Tech Mono', 'Courier New', monospace;
```

## Type Scale

| Element          | Size | Weight | Style                             |
|------------------|------|--------|-----------------------------------|
| Game Title       | 48px | 700    | Uppercase, letter-spacing: 0.15em |
| Section Header   | 28px | 700    | Uppercase, letter-spacing: 0.1em  |
| Card Title       | 22px | 600    | Uppercase                         |
| Property Name    | 16px | 600    | Uppercase                         |
| Body Text        | 15px | 400    | Normal                            |
| Button Text      | 14px | 600    | Uppercase, letter-spacing: 0.05em |
| Caption/Small    | 12px | 400    | Normal                            |
| Currency Display | 24px | 700    | Monospace                         |

---

# 4. BOARD DESIGN

## Overall Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                        COMMUNISTOPOLY                           │
│              "All players are equal, but some are               │
│                    more equal than others"                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐ │
│   │BREAD│     │     │     │     │     │     │     │     │ENEMY│ │
│   │LINE │     │     │     │     │     │     │     │     │STATE│ │
│   ├─────┼─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┼─────┤ │
│   │     │                                               │     │ │
│   ├─────┤                                               ├─────┤ │
│   │     │                                               │     │ │
│   ├─────┤              ┌───────────────┐                ├─────┤ │
│   │     │              │   ЦЕНТР       │                │     │ │
│   ├─────┤              │   CENTER      │                ├─────┤ │
│   │     │              │               │                │     │ │
│   ├─────┤              │  [Card Draw]  │                ├─────┤ │
│   │     │              │  [Dice Area]  │                │     │ │
│   ├─────┤              │  [Turn Info]  │                ├─────┤ │
│   │     │              │               │                │     │ │
│   ├─────┤              └───────────────┘                ├─────┤ │
│   │     │                                               │     │ │
│   ├─────┼─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┼─────┤ │
│   │GULAG│     │     │     │     │     │     │     │     │STOY │ │
│   │     │     │     │     │     │     │     │     │     │     │ │
│   └─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Board Specifications

- **Board Size**: Square, responsive (min 500px, ideal 700px)
- **Border**: 8px solid Soviet Red with 2px Kremlin Gold inner border
- **Corner Spaces**: 100x100px (larger, square)
- **Edge Spaces**: 60x100px (property orientation perpendicular to edge)
- **Center Area**: Contains dice, card draw pile, current turn indicator

## Space Design

### Property Spaces
```
┌─────────────────┐
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ ← Color band (property group color, 20% height)
│                 │
│  CAMP VORKUTA   │ ← Property name (centred, uppercase)
│                 │
│     ₽20         │ ← Base quota (Kremlin Gold)
│                 │
│ [Player Token]  │ ← If occupied
│ ☆☆☆            │ ← Collectivization level indicators
└─────────────────┘
```

### Corner Spaces
Larger, with distinctive iconography:

**STOY (GO)**
- Red octagon shape overlay
- Cyrillic "СТОЙ" prominently displayed
- Checkpoint barrier icon
- "Pay ₽200" and "Pilfer?" text

**GULAG**
- Dark grey/black background
- Barbed wire border decoration
- Guard tower silhouette
- Cell bars overlay

**BREADLINE**
- Parchment background
- Queue of people silhouette
- Bread loaf icon
- "Collect from all" text

**ENEMY OF THE STATE**
- Blood red background
- Broken star or "X" through star
- Pointing hand icon
- "TO GULAG" in bold

### Railway Stations
- Black background with red accents
- Train silhouette icon
- Station name in white/gold
- Number of stations controlled indicator

### Utilities
- Industrial gear/pipe iconography
- Power lines (Electric) / Water drops (Water)
- Prominent "MEANS OF PRODUCTION" label

### Tax Spaces
- Official document/form aesthetic
- Rubber stamp visual
- Calculator/coins iconography

### Card Spaces
- **Party Directive**: Red card back with hammer & sickle
- **Communist Test**: Gold card back with red star

---

# 5. CENTER BOARD AREA

The center of the board contains interactive elements:

```
┌─────────────────────────────────────┐
│         СОВЕТСКИЙ ЦЕНТР             │
│          SOVIET CENTER              │
├─────────────────────────────────────┤
│                                     │
│    ┌─────────┐    ┌─────────┐       │
│    │  PARTY  │    │COMMUNIST│       │
│    │DIRECTIVE│    │  TEST   │       │
│    │  DECK   │    │  DECK   │       │
│    │ [Click] │    │ [Click] │       │
│    └─────────┘    └─────────┘       │
│                                     │
│         ┌─────────────┐             │
│         │   ⚄   ⚂    │             │
│         │   DICE     │             │
│         │  [ROLL]    │             │
│         └─────────────┘             │
│                                     │
│    ╔═══════════════════════╗        │
│    ║  CURRENT TURN:        ║        │
│    ║  [PLAYER NAME]        ║        │
│    ║  [PIECE ICON]         ║        │
│    ╚═══════════════════════╝        │
│                                     │
└─────────────────────────────────────┘
```

## Dice Design
- 3D-effect white dice with black pips
- Red glow effect when rolling
- Gold border when doubles rolled
- Animation: Tumbling rotation, 1-2 seconds

---

# 6. PLAYER DASHBOARD

## Layout (Bottom of screen, horizontal strip)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ PLAYER DASHBOARDS                                                          │
├──────────────────┬──────────────────┬──────────────────┬──────────────────┤
│   [EXPANDED]     │   [COMPACT]      │   [COMPACT]      │   [COMPACT]      │
│   Current Player │   Player 2       │   Player 3       │   Player 4       │
│                  │                  │                  │                  │
└──────────────────┴──────────────────┴──────────────────┴──────────────────┘
```

## Expanded Player Card (Current Player)

```
╔══════════════════════════════════════════════════════════╗
║ ☭  COMRADE PLAYEROVSKY                        [HAMMER]  ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  RANK: ★★☆☆ COMMISSAR          RUBLES: ₽ 1,247         ║
║  ════════════════════          ══════════════════        ║
║                                                          ║
║  PROPERTIES UNDER CUSTODIANSHIP:                         ║
║  ┌────────┐ ┌────────┐ ┌────────┐                       ║
║  │Kolkhoz │ │Tractor │ │Moscow  │                       ║
║  │Sunrise │ │Fctry#47│ │Station │                       ║
║  │ ☆☆    │ │ ☆☆☆   │ │        │                       ║
║  └────────┘ └────────┘ └────────┘                       ║
║                                                          ║
║  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   ║
║  │ DENOUNCE │ │  TRADE   │ │ IMPROVE  │ │ END TURN │   ║
║  └──────────┘ └──────────┘ └──────────┘ └──────────┘   ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

## Compact Player Card (Other Players)

```
┌─────────────────────────┐
│ [●] IVAN               │  ← Piece icon + Name
│ ★★☆☆ ₽890             │  ← Rank stars + Rubles
│ Props: 4 | In Play     │  ← Property count + Status
└─────────────────────────┘
```

## Gulag State Display

```
╔══════════════════════════════════════╗
║ ⛓️  COMRADE BORIS  ⛓️                ║
║     *** IN THE GULAG ***             ║
╠══════════════════════════════════════╣
║                                      ║
║   SENTENCE: Turn 3 of ???            ║
║   Need: Double 4s or higher          ║
║                                      ║
║   ┌────────────┐  ┌────────────┐    ║
║   │ ROLL FOR   │  │    PAY     │    ║
║   │  ESCAPE    │  │   ₽500     │    ║
║   └────────────┘  └────────────┘    ║
║   ┌────────────┐  ┌────────────┐    ║
║   │  REQUEST   │  │  INFORM    │    ║
║   │  VOUCHER   │  │  ON OTHER  │    ║
║   └────────────┘  └────────────┘    ║
║   ┌────────────────────────────┐    ║
║   │      BRIBE STALIN          │    ║
║   └────────────────────────────┘    ║
║                                      ║
╚══════════════════════════════════════╝
```

---

# 7. STALIN'S CONTROL PANEL

Stalin gets a special elevated interface, styled as the "Kremlin Command Center."

```
╔═══════════════════════════════════════════════════════════════════════════╗
║ ☭ ═══════════════════════════════════════════════════════════════════ ☭  ║
║                     К Р Е М Л Ь    KREMLIN                               ║
║                      COMMAND CENTER                                       ║
║ ☭ ═══════════════════════════════════════════════════════════════════ ☭  ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║   STATE TREASURY: ₽ 12,450                    [AUDIT PLAYER ▼]           ║
║                                                                           ║
╠═══════════════════╦═══════════════════╦═══════════════════════════════════╣
║   TRIBUNALS       ║   RANK CONTROL    ║   SPECIAL DECREES                 ║
║ ┌───────────────┐ ║ ┌───────────────┐ ║ ┌───────────────────────────────┐ ║
║ │HOLD TRIBUNAL  │ ║ │PROMOTE PLAYER │ ║ │ THE GREAT PURGE               │ ║
║ └───────────────┘ ║ └───────────────┘ ║ └───────────────────────────────┘ ║
║ ┌───────────────┐ ║ ┌───────────────┐ ║ ┌───────────────────────────────┐ ║
║ │VIEW ACTIVE    │ ║ │DEMOTE PLAYER  │ ║ │ FIVE-YEAR PLAN                │ ║
║ └───────────────┘ ║ └───────────────┘ ║ └───────────────────────────────┘ ║
║                   ║ ┌───────────────┐ ║ ┌───────────────────────────────┐ ║
║   GULAG CONTROL   ║ │SEND TO GULAG  │ ║ │ HERO OF SOVIET UNION          │ ║
║ ┌───────────────┐ ║ └───────────────┘ ║ └───────────────────────────────┘ ║
║ │MANAGE INMATES │ ║ ┌───────────────┐ ║ ┌───────────────────────────────┐ ║
║ └───────────────┘ ║ │   EXECUTE     │ ║ │ SET PROPERTY PRICE            │ ║
║ ┌───────────────┐ ║ └───────────────┘ ║ └───────────────────────────────┘ ║
║ │ACCEPT BRIBE   │ ║                   ║                                   ║
║ │  (₽200+?)     │ ║                   ║   BRIBES PENDING: 2              ║
║ └───────────────┘ ║                   ║   [VIEW BRIBES]                   ║
║                   ║                   ║                                   ║
╚═══════════════════╩═══════════════════╩═══════════════════════════════════╝
```

## Stalin Color Scheme
- Background: Steel Blue (`#2C3E50`) with subtle star pattern
- Accent: Kremlin Gold (`#D4A84B`)
- Borders: Double-line gold borders
- Buttons: Dark blue with gold text, red hover state

---

# 8. MODAL DIALOGUES

## General Modal Style

```
┌─ ═══════════════════════════════════════════════════════ ─┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ MODAL TITLE ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓            │
├───────────────────────────────────────────────────────────┤
│                                                           │
│                    Modal content here                     │
│                                                           │
│   ┌─────────────┐                    ┌─────────────┐     │
│   │   CANCEL    │                    │   CONFIRM   │     │
│   └─────────────┘                    └─────────────┘     │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

- **Background overlay**: rgba(0, 0, 0, 0.75)
- **Modal border**: 4px solid Soviet Red, 2px gold inner
- **Header**: Soviet Red background, white text
- **Drop shadow**: 0 10px 40px rgba(0, 0, 0, 0.5)

## Tribunal Modal

```
╔═══════════════════════════════════════════════════════════════╗
║ ⚖️  T R I B U N A L  ⚖️                                       ║
║     PEOPLE'S COURT IS NOW IN SESSION                          ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║   ACCUSED: Comrade Dmitri                                     ║
║   ACCUSER: Comrade Natasha                                    ║
║   CRIME: Counter-revolutionary potato hoarding                ║
║                                                               ║
║ ┌───────────────────────────────────────────────────────────┐ ║
║ │                    ACCUSER'S CASE                         │ ║
║ │                                                           │ ║
║ │     "State your accusation, Comrade..."                   │ ║
║ │                                                           │ ║
║ │                    ⏱️ 0:27                                │ ║
║ └───────────────────────────────────────────────────────────┘ ║
║                                                               ║
║   [START DEFENCE]                                             ║
║                                                               ║
╠═══════════════════════════════════════════════════════════════╣
║                      STALIN'S JUDGEMENT                        ║
║                                                               ║
║  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐ ║
║  │  GUILTY  │ │ INNOCENT │ │  BOTH    │ │  INSUFFICIENT    │ ║
║  │          │ │          │ │  GUILTY  │ │    EVIDENCE      │ ║
║  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘ ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

## Communist Test Modal

```
╔═══════════════════════════════════════════════════════════════╗
║ ★  C O M M U N I S T   T E S T  ★                            ║
║     PROVE YOUR LOYALTY TO THE PARTY                           ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║   DIFFICULTY: ██░░░ MEDIUM                                    ║
║   REWARD: ₽200  |  PENALTY: ₽100                             ║
║                                                               ║
║ ┌───────────────────────────────────────────────────────────┐ ║
║ │                                                           │ ║
║ │    "In what year did Stalin come to power?"               │ ║
║ │                                                           │ ║
║ └───────────────────────────────────────────────────────────┘ ║
║                                                               ║
║   Reader: Comrade Alexei (chosen by Stalin)                   ║
║                                                               ║
║   ┌────────────────────────────────────────────────────┐     ║
║   │ The accused has answered. Was it correct?          │     ║
║   └────────────────────────────────────────────────────┘     ║
║                                                               ║
║        ┌──────────────┐        ┌──────────────┐              ║
║        │   CORRECT    │        │  INCORRECT   │              ║
║        │      ✓       │        │      ✗       │              ║
║        └──────────────┘        └──────────────┘              ║
║                                                               ║
║   Correct answer: 1924                                        ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

## Property Purchase Modal

```
╔═══════════════════════════════════════════════════════════════╗
║ 🏭  STATE PROPERTY TRANSFER  🏭                               ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║   ┌─────────────────────────────────────┐                    ║
║   │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  ← Property color   ║
║   │                                     │                    ║
║   │      TRACTOR FACTORY #47            │                    ║
║   │      Industrial Centers             │                    ║
║   │                                     │                    ║
║   │      Base Quota: ₽100               │                    ║
║   │                                     │                    ║
║   │      ☆ Worker's Committee: +50%     │                    ║
║   │      ☆☆ Party Oversight: +100%      │                    ║
║   │      ☆☆☆ Full Collectivization: +150%                   ║
║   │      ☆☆☆☆ Model Soviet: +200%       │                    ║
║   │      ★ People's Palace: +300%       │                    ║
║   │                                     │                    ║
║   └─────────────────────────────────────┘                    ║
║                                                               ║
║   STALIN HAS SET THE PRICE: ₽ [____150____]                  ║
║   (Base value: ₽100 — Range: ₽50-200)                        ║
║                                                               ║
║   Your balance: ₽1,247                                        ║
║                                                               ║
║     ┌───────────────────┐     ┌───────────────────┐          ║
║     │  DECLINE - Leave  │     │  ACCEPT - Become  │          ║
║     │   for the State   │     │    Custodian      │          ║
║     └───────────────────┘     └───────────────────┘          ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

---

# 9. BUTTONS & INTERACTIVE ELEMENTS

## Primary Button (Affirmative Actions)

```css
.btn-primary {
  background: linear-gradient(180deg, #C41E3A 0%, #8B0000 100%);
  color: #FAF6EF;
  border: 2px solid #D4A84B;
  padding: 12px 24px;
  font-family: 'Oswald', sans-serif;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  box-shadow: 0 4px 0 #5C0A1A, 0 6px 10px rgba(0,0,0,0.3);
  transition: all 0.1s ease;
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

## Secondary Button (Cancel/Decline)

```css
.btn-secondary {
  background: linear-gradient(180deg, #4A4A4A 0%, #2A2A2A 100%);
  color: #FAF6EF;
  border: 2px solid #666;
  /* Same padding, font, shadow structure as primary */
}
```

## Danger Button (Denounce, Execute, etc.)

```css
.btn-danger {
  background: linear-gradient(180deg, #722F37 0%, #4A1C21 100%);
  color: #FAF6EF;
  border: 2px solid #C41E3A;
  /* Pulsing glow animation on hover */
}
```

## Stalin Button (Gold accent)

```css
.btn-stalin {
  background: linear-gradient(180deg, #2C3E50 0%, #1A252F 100%);
  color: #D4A84B;
  border: 2px solid #D4A84B;
}
```

---

# 10. ICONS & IMAGERY

## Playing Piece Icons

Design simple, recognizable silhouette icons (32x32px base, scalable):

| Piece           | Icon Description               |
|-----------------|--------------------------------|
| Hammer          | Classic claw hammer silhouette |
| Sickle          | Curved farming sickle          |
| Red Star        | Five-pointed Soviet star       |
| Tank            | T-34 tank profile silhouette   |
| Bread Loaf      | Round bread loaf shape         |
| Iron Curtain    | Curtain/drape with jagged edge |
| Vodka Bottle    | Classic bottle silhouette      |
| Statue of Lenin | Lenin bust/pointing pose       |

## UI Icons (16-24px)

- **Rubles**: ₽ symbol or coin stack
- **Rank Stars**: Filled/empty stars
- **Gulag**: Barred window or chain
- **Denounce**: Pointing finger
- **Trade**: Two arrows exchanging
- **Dice**: Two dice
- **Cards**: Stacked cards
- **Collectivization**: Factory with stars above

## Decorative Elements

- **Hammer & Sickle**: Used in headers, corners, dividers
- **Soviet Star**: Rank indicators, bullet points
- **Wheat Sheaves**: Border decorations
- **Gear/Cog**: Industrial elements
- **Banner/Ribbon**: Achievement notifications

---

# 11. ANIMATIONS & TRANSITIONS

## Dice Roll
- Duration: 1.5 seconds
- Easing: bounce/elastic
- Effect: 3D tumbling rotation, lands with slight bounce

## Piece Movement
- Duration: 300ms per space
- Easing: ease-in-out
- Effect: Hop animation between spaces

## Modal Appearance
- Duration: 200ms
- Effect: Scale from 0.9 to 1.0 with fade in

## Button Press
- Duration: 100ms
- Effect: translateY with shadow reduction (press down feel)

## Card Draw
- Duration: 500ms
- Effect: Card flips from deck, reveals content

## Rank Change
- Duration: 800ms
- Effect: Stars fill/empty with golden glow pulse

## Gulag Entry
- Duration: 600ms
- Effect: Screen flash red, player piece "dragged" to corner

---

# 12. SOUND DESIGN (Optional)

If implementing audio, use these guidelines:

| Event           | Sound Description             |
|-----------------|-------------------------------|
| Dice Roll       | Wooden dice clatter           |
| Move            | Footstep or piece sliding     |
| Purchase        | Cash register / coin drop     |
| Denouncement    | Dramatic chord / gavel        |
| Gulag           | Heavy door slam, chains       |
| Tribunal Start  | Soviet anthem snippet (2 sec) |
| Correct Answer  | Triumphant brass fanfare      |
| Wrong Answer    | Sad trombone / buzzer         |
| Rank Up         | Heroic orchestral swell       |
| Rank Down       | Descending brass              |
| Stalin Speaking | Deep echo effect on UI sounds |

---

# 13. RESPONSIVE CONSIDERATIONS

## Minimum Viewport: 1024 x 768 (Tablet Landscape)

## Breakpoints

| Size        | Layout Adjustment                                 |
|-------------|---------------------------------------------------|
| < 1024px    | Not supported - show "rotate device" message      |
| 1024-1279px | Compact mode - smaller board, stacked dashboards  |
| 1280-1699px | Standard mode - side-by-side layout               |
| 1700px+     | Enhanced mode - larger board, more visible detail |

## Touch Targets
- Minimum 44x44px for all interactive elements
- Property spaces expand on tap to show details
- Long-press for additional options (context menu)

---

# 14. GAME LOG PANEL

A scrolling log of all game events, styled as official Soviet records:

```
╔═══════════════════════════════════════╗
║ OFFICIAL PARTY RECORD                 ║
╠═══════════════════════════════════════╣
║ 14:32 - Comrade Ivan paid ₽200        ║
║         travel tax at STOY            ║
║───────────────────────────────────────║
║ 14:31 - Comrade Natasha became        ║
║         Custodian of Kolkhoz Sunrise  ║
║───────────────────────────────────────║
║ 14:29 - TRIBUNAL: Boris found         ║
║         GUILTY of insufficient        ║
║         enthusiasm. Sent to Gulag.    ║
║───────────────────────────────────────║
║ 14:27 - Comrade Boris rolled 7        ║
║                                       ║
║              [Load More]              ║
╚═══════════════════════════════════════╝
```

---

# 15. SETUP SCREENS

## Welcome Screen

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║            ☭ ═══════════════════════════════════════════ ☭               ║
║                                                                           ║
║               ██████╗ ██████╗ ███╗   ███╗███╗   ███╗██╗   ██╗            ║
║              ██╔════╝██╔═══██╗████╗ ████║████╗ ████║██║   ██║            ║
║              ██║     ██║   ██║██╔████╔██║██╔████╔██║██║   ██║            ║
║              ██║     ██║   ██║██║╚██╔╝██║██║╚██╔╝██║██║   ██║            ║
║              ╚██████╗╚██████╔╝██║ ╚═╝ ██║██║ ╚═╝ ██║╚██████╔╝            ║
║               ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝     ╚═╝ ╚═════╝             ║
║                    N I S T O P O L Y                                     ║
║                                                                           ║
║            ☭ ═══════════════════════════════════════════ ☭               ║
║                                                                           ║
║              "All players are equal, but some players                     ║
║                    are more equal than others."                           ║
║                                                                           ║
║                                                                           ║
║                     ┌─────────────────────────┐                          ║
║                     │      NEW GAME           │                          ║
║                     └─────────────────────────┘                          ║
║                     ┌─────────────────────────┐                          ║
║                     │    CONTINUE GAME        │                          ║
║                     └─────────────────────────┘                          ║
║                     ┌─────────────────────────┐                          ║
║                     │     HOW TO PLAY         │                          ║
║                     └─────────────────────────┘                          ║
║                                                                           ║
║                                                                           ║
║                  Glory to the Motherland. Glory to Stalin.                ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

## Player Setup Screen

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                      REGISTER THE PROLETARIAT                             ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║   Number of Comrades:   [3] [4] [5] [6]                                   ║
║                                                                           ║
║ ┌─────────────────────────────────────────────────────────────────────┐  ║
║ │  COMRADE 1 (STALIN - Game Master)                                   │  ║
║ │  Name: [_________________________]                                  │  ║
║ │  ★ This player will control the game as Stalin                      │  ║
║ └─────────────────────────────────────────────────────────────────────┘  ║
║                                                                           ║
║ ┌─────────────────────────────────────────────────────────────────────┐  ║
║ │  COMRADE 2                                                          │  ║
║ │  Name: [_________________________]                                  │  ║
║ │  Piece: [Hammer ▼]  "The worker's tool, building the future"        │  ║
║ └─────────────────────────────────────────────────────────────────────┘  ║
║                                                                           ║
║ ┌─────────────────────────────────────────────────────────────────────┐  ║
║ │  COMRADE 3                                                          │  ║
║ │  Name: [_________________________]                                  │  ║
║ │  Piece: [Sickle ▼]  "The farmer's blade, reaping the harvest"       │  ║
║ └─────────────────────────────────────────────────────────────────────┘  ║
║                                                                           ║
║                     ┌─────────────────────────┐                          ║
║                     │   BEGIN THE REVOLUTION  │                          ║
║                     └─────────────────────────┘                          ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

# 16. VICTORY/END SCREENS

## Survivor Victory

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║                           ☭ ★ ☭ ★ ☭ ★ ☭                                  ║
║                                                                           ║
║                              SURVIVOR                                     ║
║                                                                           ║
║                         COMRADE NATASHA                                   ║
║                                                                           ║
║                   Has outlasted all other comrades.                       ║
║                                                                           ║
║                      In the Soviet Union,                                 ║
║                   survival is victory enough.                             ║
║                                                                           ║
║                           ☭ ★ ☭ ★ ☭ ★ ☭                                  ║
║                                                                           ║
║                     Final Statistics:                                     ║
║                     Turns Survived: 47                                    ║
║                     Denouncements Made: 5                                 ║
║                     Time in Gulag: 3 turns                                ║
║                     Final Rank: Commissar                                 ║
║                     Final Wealth: ₽2,340                                  ║
║                                                                           ║
║                     ┌─────────────────────────┐                          ║
║                     │       NEW GAME          │                          ║
║                     └─────────────────────────┘                          ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

## Stalin Victory (All Eliminated)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║                        THE STATE WINS                                     ║
║                                                                           ║
║                   All comrades have been eliminated.                      ║
║                                                                           ║
║                      The Party is eternal.                                ║
║                      Long live Stalin.                                    ║
║                                                                           ║
║                 ┌─────────────────────────┐                              ║
║                 │  [Stalin Portrait Here] │                              ║
║                 └─────────────────────────┘                              ║
║                                                                           ║
║                     ┌─────────────────────────┐                          ║
║                     │       NEW GAME          │                          ║
║                     └─────────────────────────┘                          ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

# APPENDIX: ASSET CHECKLIST

## Required Custom Assets
- [ ] Playing piece icons (8)
- [ ] Rank star icons (filled/empty)
- [ ] Property group icons
- [ ] Card back designs (2)
- [ ] Corner space illustrations (4)
- [ ] Soviet decorative borders
- [ ] Hammer & sickle motif
- [ ] Background textures (paper, worn)

## Fonts to Include
All three are loaded via Google Fonts in `index.html` and wired to the `--font-*` custom properties
in `src/index.css`.

- [x] Oswald (or Bebas Neue)
- [x] Roboto Condensed
- [x] Roboto Mono

## Optional Audio Assets
- [ ] Dice roll sound
- [ ] Purchase confirmation
- [ ] Gulag door
- [ ] Tribunal gavel
- [ ] Soviet anthem snippet
- [ ] Victory fanfare

---

*This document should be used alongside the Communistopoly Rules document to implement the complete digital game experience.*

**Слава Родине! Glory to the Motherland!**
