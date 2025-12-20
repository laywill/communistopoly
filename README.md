# Communistopoly ☭

A satirical digital board game that transforms Monopoly's capitalist fantasy into a darkly comedic simulation of Soviet bureaucracy, paranoia, and ideological absurdity.

**"All players are equal, but some players are more equal than others."**

## Overview

Communistopoly is a shared-screen/hot-seat digital board game for 3-6 players, where one player takes on the role of "Stalin" (the game master) and controls the fate of all other comrades. Victory is not achieved through wealth accumulation—it is survived through political maneuvering, strategic betrayal, and shameless flattery of Comrade Stalin.

This repository contains the web-based implementation built with React, TypeScript, and Vite, featuring authentic Soviet-era visual design inspired by Constructivist propaganda art.

## Current Status: Milestone 1 Complete ✓

**Static Board Implementation** - The visual foundation is complete with all 40 board spaces, Soviet-themed styling, and responsive layout. No game logic yet—this is the foundation for future development.

### What's Implemented
- ✅ React + TypeScript + Vite project setup
- ✅ Complete board rendering with 40 spaces
- ✅ All space types: Properties, Railways, Utilities, Taxes, Cards, Corners
- ✅ Property color groups matching the Soviet theme
- ✅ Soviet-themed styling (colors, fonts, borders)
- ✅ Board center placeholder
- ✅ Devcontainer configuration
- ✅ Responsive design (1024px - 1600px+)

### What's Next (Milestone 2)
- State management (Zustand store)
- Player setup flow
- Game initialization
- Player pieces on the board
- Dice rolling and movement

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
   Navigate to http://localhost:5173

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
5. Access the app at http://localhost:5173

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
- **Build Tool**: Vite 5
- **Styling**: CSS Modules
- **State Management**: (Coming in Milestone 2) - Zustand or React Context + useReducer
- **Fonts**: Google Fonts (Oswald, Roboto Condensed, Roboto Mono)
- **Audio**: (Future) Howler.js

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

## Development Roadmap

### Phase 1: Foundation (Complete) ✓
- [x] Project setup
- [x] Board rendering
- [x] All space types implemented
- [x] Soviet theme styling

### Phase 2: Core Game Loop ✓
- [x] Game state management
- [x] Dice rolling and movement
- [x] Turn management
- [x] Basic space resolution

### Phase 3: Property System (Next)
- [ ] Property ownership (custodianship)
- [ ] Quota collection (rent)
- [ ] Collectivization (improvements)
- [ ] Trading system

### Phase 4: Stalin & Special Mechanics
- [ ] Stalin control panel
- [ ] Denouncement system
- [ ] Tribunal flow
- [ ] Gulag mechanics

### Phase 5: Cards & Tests
- [ ] Party Directive cards
- [ ] Communist Test system
- [ ] Card deck management

### Phase 6: Player Pieces
- [ ] Piece selection
- [ ] Special abilities
- [ ] Restrictions enforcement

### Phase 7: Polish & Completion
- [ ] Player elimination
- [ ] Victory conditions
- [ ] Game log
- [ ] Animations
- [ ] Sound effects (optional)

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

---

## Testing the Board

After starting the dev server, you should see:
- A complete board with all 40 spaces
- Four corner spaces (STOY, GULAG, BREADLINE, ENEMY OF THE STATE)
- Property spaces with color-coded bands
- Railway stations in black with red accents
- Utilities with special "COMMISSAR+ ONLY" markers
- Tax spaces with warning styling
- Card spaces (Party Directive and Communist Test)
- A center area with placeholder for dice, cards, and turn info

The board should be:
- Centered on screen
- Properly bordered with Soviet Red and Kremlin Gold
- Responsive to window size
- Visually complete and styled according to the Soviet theme

---

**Слава Родине! Glory to the Motherland!**

**За коммунизм! For Communism!**
