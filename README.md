# Communistopoly ☭

A satirical digital board game that transforms Monopoly's capitalist fantasy into a darkly comedic simulation of Soviet bureaucracy, paranoia, and ideological absurdity.

**"All players are equal, but some players are more equal than others."**

## Overview

Communistopoly is a shared-screen/hot-seat digital board game for 3-6 players, where one player takes on the role of "Stalin" (the game master) and controls the fate of all other comrades. Victory is not achieved through wealth accumulation—it is survived through political manoeuvring, strategic betrayal, and shameless flattery of Comrade Stalin.

This repository contains the web-based implementation built with React, TypeScript, and Vite, featuring authentic Soviet-era visual design inspired by Constructivist propaganda art.

## Current Status: Fully Playable Game - All Milestones Complete! ✓

**Communistopoly is now a complete, fully playable board game!** All core mechanics, special features, and victory conditions have been implemented. The game is ready for 3-6 players with one acting as Stalin.

### What's Implemented

#### Core Foundation ✓
- ✅ React + TypeScript + Vite project setup
- ✅ Complete 40-space board with Soviet theme
- ✅ Zustand state management with persistence
- ✅ Error boundary for robust error handling
- ✅ Responsive design (1024px - 1600px+)

#### Game Loop & Movement ✓
- ✅ Player setup (3-6 players + Stalin)
- ✅ Dice rolling with doubles detection
- ✅ Player movement around board
- ✅ Turn management with proper phase tracking
- ✅ Round system for tracking game time

#### Property System ✓
- ✅ Property custodianship (ownership)
- ✅ Quota collection (rent system)
- ✅ Collectivization levels (0-5 improvements)
- ✅ Mortgaging and unmortgaging
- ✅ Property trading between players
- ✅ Rank restrictions enforcement

#### The Gulag System ✓
- ✅ Multiple entry reasons (doubles, denouncement, debt, etc.)
- ✅ Escalating escape difficulty (1st turn: 6s, 5th turn: any doubles)
- ✅ Five escape methods (roll, pay, vouch, inform, bribe)
- ✅ Voucher system with consequences
- ✅ 10-turn elimination mechanic
- ✅ Rehabilitation confessions (optional)

#### Stalin Powers ✓
- ✅ Stalin control panel
- ✅ Bribe acceptance/rejection
- ✅ Price setting for properties
- ✅ Confession review system
- ✅ Absolute authority over game rules

#### Cards & Tests ✓
- ✅ Party Directive deck (32 cards)
- ✅ Communist Test system (Easy/Medium/Hard/Trick)
- ✅ Card effects (movement, money, gulag, rank changes)
- ✅ Deck reshuffling when empty
- ✅ Rank progression through tests

#### Player Pieces & Abilities ✓
- ✅ 8 unique pieces (Hammer, Sickle, Red Star, Tank, etc.)
- ✅ Special abilities for each piece
- ✅ Piece restrictions (Tank can't own Collective Farms, etc.)
- ✅ Ability cooldowns and one-time use tracking

#### Special Property Abilities ✓
- ✅ Siberian Camps: Send to Gulag (Stalin approval required)
- ✅ KGB Headquarters: Preview test questions
- ✅ Ministry of Truth: Rewrite rules
- ✅ Pravda Press: Force re-votes

#### Game End & Victory ✓
- ✅ Individual elimination (bankruptcy, execution, Gulag timeout, etc.)
- ✅ Survivor victory condition
- ✅ Stalin victory (all players eliminated)
- ✅ Unanimous end vote system
- ✅ Victory/defeat screens with statistics
- ✅ Final game statistics display

#### Polish & Features ✓
- ✅ Comprehensive game log
- ✅ Statistics tracking (turns, Gulag time, tests, etc.)
- ✅ Save/load game state (automatic)
- ✅ Animations and visual effects
- ✅ Soviet-themed UI throughout
- ✅ Modal system for all interactions

## Quick Start

### Prerequisites
- Node.js 20+ (LTS)
- npm or yarn

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/communistopoly.git
   cd communistopoly
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to <http://localhost:5173>

5. **Build for production**
   ```bash
   npm run build
   npm run preview
   ```

### Using DevContainer (Recommended)

If you use Visual Studio Code with the Dev Containers extension:

1. Open the project in VS Code
2. Press `F1` and select "Dev Containers: Reopen in Container"
3. Wait for the container to build and dependencies to install
4. Run `npm run dev` in the integrated terminal
5. Access the app at <http://localhost:5173>

The devcontainer automatically:
- Uses Node 20 LTS
- Installs all dependencies
- Sets up recommended VS Code extensions (ESLint, Prettier)
- Configures auto-formatting on save
- Exposes port 5173 for the Vite dev server

## Project Structure

```
communistopoly/
├── .devcontainer/          # DevContainer configuration
├── Designs/                # Design documents (rules, visuals, technical spec)
├── src/
│   ├── components/
│   │   ├── board/         # Board and all space components
│   │   ├── ui/            # Reusable UI components (future)
│   │   └── layout/        # Layout components (future)
│   ├── data/
│   │   ├── spaces.ts      # All 40 board space definitions
│   │   ├── properties.ts  # Property group information
│   │   └── constants.ts   # Game constants and colors
│   ├── types/
│   │   └── game.ts        # TypeScript interfaces
│   ├── styles/            # Global styles (CSS variables)
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # Entry point
│   └── index.css          # Global CSS with Soviet theme variables
├── public/                # Static assets (future: images, sounds)
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Technology Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 7.3
- **Styling**: CSS with CSS Modules
- **State Management**: Zustand with persistence middleware
- **Fonts**: Google Fonts (Oswald, Roboto Condensed, Roboto Mono)
- **Error Handling**: React Error Boundaries
- **Type Safety**: TypeScript strict mode

## Design Philosophy

The visual design draws from **Soviet Constructivist propaganda art** (1920s-1950s):
- Bold geometric shapes and stark contrasts
- Limited color palette (Soviet Red, Kremlin Gold, Propaganda Black)
- Heavy typography with condensed sans-serif fonts
- Satirically bureaucratic aesthetic (forms, stamps, official seals)
- Aged paper textures and weathered appearance

For complete design specifications, see `Designs/communistopoly-design.md`.

## Game Rules

For the complete rule set, see `Designs/communistopoly-rules.md`. Key mechanics include:

- **Party Rank System**: Proletariat → Party Member → Commissar → Inner Circle
- **The Gulag**: Not jail—a crucible of suffering with complex escape mechanics
- **Denouncement System**: Betray your comrades to survive
- **Communist Tests**: Trivia questions with rewards and penalties
- **Stalin's Powers**: Absolute authority over all players
- **Special Mechanics**: Tribunals, property collectivization, pilfering, and more

## How to Play

### Setup
1. Launch the game and click "START NEW GAME"
2. Select 3-6 players (one will be Stalin)
3. Choose your piece - each has unique abilities
4. Stalin player gets the control panel

### Basic Gameplay
- **Turns**: Roll dice, move, resolve the space you land on
- **Properties**: Land on unclaimed properties to purchase them (if your rank allows)
- **Quotas**: Pay rent to property custodians when landing on their properties
- **Cards**: Draw Party Directives or take Communist Tests when landing on those spaces
- **Passing STOY**: Collect 200₽ when passing Start the Oligarch Year

### Property Rents and Collectivization Levels

Properties can be improved through collectivization (similar to houses/hotels in Monopoly). Each collectivization level dramatically increases the quota (rent) owed when other players land on your property.

**Collectivization Levels:**
- **None** (Site Only): Base quota × 1.0
- **★☆☆☆☆** (Worker's Committee): Base quota × 3.0 (costs ₽100)
- **★★☆☆☆** (Party Oversight): Base quota × 9.0 (costs ₽100)
- **★★★☆☆** (Full Collectivization): Base quota × 15.0 (costs ₽100)
- **★★★★☆** (Model Soviet): Base quota × 20.0 (costs ₽100)
- **★★★★★** (People's Palace): Base quota × 30.0 (costs ₽200)

#### Standard Properties

| Property                    | Cost | Mortgage | Rent - Site Only | Rent ★☆☆☆☆ | Rent ★★☆☆☆ | Rent ★★★☆☆ | Rent ★★★★☆ | Rent ★★★★★ |
|-----------------------------|------|----------|------------------|------------|------------|------------|------------|------------|
| **Siberian Work Camps**     |      |          |                  |            |            |            |            |            |
| Camp Vorkuta                | ₽60  | ₽30      | ₽2               | ₽6         | ₽18        | ₽30        | ₽40        | ₽60        |
| Camp Kolyma                 | ₽60  | ₽30      | ₽4               | ₽12        | ₽36        | ₽60        | ₽80        | ₽120       |
| **Collective Farms**        |      |          |                  |            |            |            |            |            |
| Kolkhoz Sunrise             | ₽100 | ₽50      | ₽6               | ₽18        | ₽54        | ₽90        | ₽120       | ₽180       |
| Kolkhoz Progress            | ₽100 | ₽50      | ₽6               | ₽18        | ₽54        | ₽90        | ₽120       | ₽180       |
| Kolkhoz Victory             | ₽120 | ₽60      | ₽8               | ₽24        | ₽72        | ₽120       | ₽160       | ₽240       |
| **Industrial Centers**      |      |          |                  |            |            |            |            |            |
| Tractor Factory #47         | ₽140 | ₽70      | ₽10              | ₽30        | ₽90        | ₽150       | ₽200       | ₽300       |
| Steel Mill Molotov          | ₽140 | ₽70      | ₽10              | ₽30        | ₽90        | ₽150       | ₽200       | ₽300       |
| Munitions Plant Kalashnikov | ₽160 | ₽80      | ₽12              | ₽36        | ₽108       | ₽180       | ₽240       | ₽360       |
| **Government Ministries**   |      |          |                  |            |            |            |            |            |
| Ministry of Truth           | ₽180 | ₽90      | ₽14              | ₽42        | ₽126       | ₽210       | ₽280       | ₽420       |
| Ministry of Plenty          | ₽180 | ₽90      | ₽14              | ₽42        | ₽126       | ₽210       | ₽280       | ₽420       |
| Ministry of Love            | ₽200 | ₽100     | ₽16              | ₽48        | ₽144       | ₽240       | ₽320       | ₽480       |
| **Military Installations**  |      |          |                  |            |            |            |            |            |
| Red Army Barracks           | ₽220 | ₽110     | ₽18              | ₽54        | ₽162       | ₽270       | ₽360       | ₽540       |
| KGB Headquarters            | ₽220 | ₽110     | ₽18              | ₽54        | ₽162       | ₽270       | ₽360       | ₽540       |
| Nuclear Bunker Arzamas-16   | ₽240 | ₽120     | ₽20              | ₽60        | ₽180       | ₽300       | ₽400       | ₽600       |
| **State Media**             |      |          |                  |            |            |            |            |            |
| Pravda Printing Press       | ₽260 | ₽130     | ₽22              | ₽66        | ₽198       | ₽330       | ₽440       | ₽660       |
| Radio Moscow                | ₽260 | ₽130     | ₽22              | ₽66        | ₽198       | ₽330       | ₽440       | ₽660       |
| State Television Center     | ₽280 | ₽140     | ₽22              | ₽66        | ₽198       | ₽330       | ₽440       | ₽660       |
| **Party Elite District**    |      |          |                  |            |            |            |            |            |
| Politburo Apartments        | ₽300 | ₽150     | ₽26              | ₽78        | ₽234       | ₽390       | ₽520       | ₽780       |
| Dachas of the Nomenklatura  | ₽300 | ₽150     | ₽26              | ₽78        | ₽234       | ₽390       | ₽520       | ₽780       |
| The Lubyanka                | ₽320 | ₽160     | ₽28              | ₽84        | ₽252       | ₽420       | ₽560       | ₽840       |
| **Kremlin Complex**         |      |          |                  |            |            |            |            |            |
| Lenin's Mausoleum           | ₽350 | ₽175     | ₽35              | ₽105       | ₽315       | ₽525       | ₽700       | ₽1,050     |
| Stalin's Private Office     | ₽400 | ₽200     | ₽50              | ₽150       | ₽450       | ₽750       | ₽1,000     | ₽1,500     |

#### Railways (Trans-Siberian Railway Stations)

| Property            | Cost | Mortgage | Rent (1 owned) | Rent (2 owned) | Rent (3 owned) | Rent (4 owned) |
|---------------------|------|----------|----------------|----------------|----------------|----------------|
| Moscow Station      | ₽200 | ₽100     | ₽25            | ₽50            | ₽100           | ₽200           |
| Novosibirsk Station | ₽200 | ₽100     | ₽25            | ₽50            | ₽100           | ₽200           |
| Irkutsk Station     | ₽200 | ₽100     | ₽25            | ₽50            | ₽100           | ₽200           |
| Vladivostok Station | ₽200 | ₽100     | ₽25            | ₽50            | ₽100           | ₽200           |

#### Utilities (Means of Production)

| Property                  | Cost | Mortgage | Rent (1 owned)     | Rent (2 owned)      |
|---------------------------|------|----------|--------------------|---------------------|
| State Electricity Board   | ₽150 | ₽75      | 4 × dice roll      | 10 × dice roll      |
| People's Water Collective | ₽150 | ₽75      | 4 × dice roll      | 10 × dice roll      |

**Note**: Utilities and railways cannot be collectivized. Only COMMISSAR rank or higher may own utilities.

### The Gulag
- Enter via: Rolling 3 doubles, denouncement, debt default, Stalin's decree
- Escape by: Rolling required doubles, paying 500₽, getting vouched, informing on another, bribing Stalin
- Difficulty increases each turn (1st turn: need 6-6, 5th turn: any doubles)
- **10 turns in Gulag = Elimination!**

### Winning
- **Survivor Victory**: Be the last player standing (not eliminated)
- **Stalin Victory**: All players are eliminated
- **Unanimous End**: All players vote to end the game

### Special Features
- **Piece Abilities**: Each game piece has unique powers (check rules for details)
- **Rank System**: Progress from Proletariat → Party Member → Commissar → Inner Circle
- **Property Abilities**: Some properties grant special powers when owned
- **Trading**: Players can trade properties, money, and favours
- **Confessions**: Players in Gulag can write confessions to Stalin for possible early release

For complete rules, see `Designs/communistopoly-rules.md`.

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Minimum viewport: 1024 x 768 (tablet landscape)
- Optimal viewport: 1280 x 800 or larger

## Contributing

This is a personal/educational project. If you'd like to contribute or have suggestions:

1. Read the design documents in the `Designs/` folder
2. Open an issue to discuss your ideas
3. Fork and submit a pull request

## License

This project is a satirical parody and is not affiliated with Hasbro or Monopoly. All satirical content is protected as fair use for commentary and parody purposes.

### Legal Disclaimers

As the developer of this Monopoly game project, it is essential to clarify the following legal aspects:

1. Game Mechanics and Rules: The game mechanics and rules of Monopoly have been widely known and played for many years. This project aims to offer a digital experience, incorporating some of the classic Monopoly experience with novel concepts, ideas, artwork, and mechanics, utilizing original concepts that have become common knowledge.

2. Original Monopoly Intellectual Property: The Monopoly board game is a registered trademark and copyrighted property of Hasbro Inc. and its respective licensors. This project is not an official representation or product of Hasbro Inc., and no direct affiliation or endorsement is implied.

3. License and Usage: This Monopoly style game project is developed with the intent of being a personal project with satirical intent.

4. Fair Use and Transformative Work: This project falls under the category of "fair use" as it is a transformative work that provides a unique digital experience based on the original Monopoly game. It is not intended to compete with or harm the commercial interests of the original trademark owner.

5. No Warranty or Liability: While efforts have been made to create an enjoyable and bug-free experience, this project is provided as-is without any warranty. The developer shall not be liable for any issues or damages arising from the use of this software.

6. Attribution: This project may include third-party libraries or assets that are appropriately credited and licensed under their respective terms. Any attributions and licenses should be preserved as required by the respective authors.

7. Personal Responsibility: As the developer, you are responsible for complying with all applicable laws, including intellectual property laws, and ensuring that your usage of this project is within legal boundaries.

## Features & Highlights

### Automatic Save/Load
- Game state is automatically saved to browser localStorage
- Resume interrupted games automatically
- Clear save data from Main Menu if needed

### Statistics Tracking
- Individual player stats (turns played, Gulag time, tests passed/failed)
- Game-wide statistics (total denouncements, tribunals, Gulag sentences)
- Final statistics display on game end screen

### Error Handling
- Error boundary catches crashes gracefully
- Clear error messages with restart option
- Stack traces in development mode

### Keyboard Shortcuts
- `Ctrl+Shift+R`: Quick reset game (development feature)

### Visual Polish
- Smooth animations for dice rolls and movements
- Soviet-themed color palette throughout
- Responsive modals for all interactions
- Pulsing animations on important elements
- Screen shake effects for dramatic moments (eliminated players coming soon)

---

## Known Limitations

- **Single Device Only**: This is a hot-seat game requiring all players to share one screen
- **No AI Players**: All players must be human (including Stalin)
- **No Undo**: All actions are final once committed
- **Browser Storage**: Save data is stored locally and will be lost if browser data is cleared

---

**Слава Родине! Glory to the Motherland!**

**За коммунизм! For Communism!**
