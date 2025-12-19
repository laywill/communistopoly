import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState, Player, Property, GamePhase, TurnPhase, LogEntry } from '../types/game';
import { BOARD_SPACES, getSpaceById } from '../data/spaces';

interface GameActions {
  // Game phase management
  setGamePhase: (phase: GamePhase) => void;
  startNewGame: () => void;

  // Player management
  initializePlayers: (playerSetups: Array<{ name: string; piece: Player['piece']; isStalin: boolean }>) => void;
  setCurrentPlayer: (index: number) => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;

  // Property management
  initializeProperties: () => void;
  setPropertyCustodian: (spaceId: number, custodianId: string | null) => void;
  updateCollectivizationLevel: (spaceId: number, level: number) => void;

  // Turn management
  rollDice: () => void;
  finishRolling: () => void;
  movePlayer: (playerId: string, spaces: number) => void;
  finishMoving: () => void;
  endTurn: () => void;
  setTurnPhase: (phase: TurnPhase) => void;

  // Gulag management
  sendToGulag: (playerId: string, reason: string) => void;
  demotePlayer: (playerId: string) => void;

  // STOY handling
  handleStoyPassing: (playerId: string) => void;
  handleStoyPilfer: (playerId: string, diceRoll: number) => void;

  // Game log
  addLogEntry: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;

  // Treasury
  adjustTreasury: (amount: number) => void;
}

type GameStore = GameState & GameActions;

const initialState: GameState = {
  gamePhase: 'welcome',
  players: [],
  stalinPlayerId: null,
  currentPlayerIndex: 0,
  properties: [],
  stateTreasury: 0,
  turnPhase: 'pre-roll',
  doublesCount: 0,
  hasRolled: false,
  dice: [1, 1],
  isRolling: false,
  gameLog: [],
  pendingAction: null,
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setGamePhase: (phase) => set({ gamePhase: phase }),

      startNewGame: () => set({ ...initialState, gamePhase: 'setup' }),

      initializePlayers: (playerSetups) => {
        const players: Player[] = playerSetups.map((setup, index) => ({
          id: `player-${index}`,
          name: setup.name,
          piece: setup.piece,
          rank: setup.piece === 'redStar' ? 'partyMember' : 'proletariat',
          rubles: 1500,
          position: 0,
          properties: [],
          inGulag: false,
          gulagTurns: 0,
          isEliminated: false,
          isStalin: setup.isStalin,
          correctTestAnswers: 0,
          consecutiveFailedTests: 0,
          underSuspicion: false,
        }));

        const stalinPlayer = players.find(p => p.isStalin);
        const nonStalinPlayers = players.filter(p => !p.isStalin);

        // Calculate state treasury based on player count
        const playerCount = nonStalinPlayers.length;
        const stateTreasury = playerCount * 1500; // Starting treasury

        set({
          players,
          stalinPlayerId: stalinPlayer?.id || null,
          currentPlayerIndex: 1, // Start with first non-Stalin player
          stateTreasury,
        });

        // Initialize properties
        get().initializeProperties();
      },

      setCurrentPlayer: (index) => set({ currentPlayerIndex: index }),

      updatePlayer: (playerId, updates) => {
        set((state) => ({
          players: state.players.map((player) =>
            player.id === playerId ? { ...player, ...updates } : player
          ),
        }));
      },

      initializeProperties: () => {
        const properties: Property[] = BOARD_SPACES
          .filter((space) => space.type === 'property' || space.type === 'railway' || space.type === 'utility')
          .map((space) => ({
            spaceId: space.id,
            custodianId: null, // All start owned by the STATE
            collectivizationLevel: 0,
          }));

        set({ properties });
      },

      setPropertyCustodian: (spaceId, custodianId) => {
        set((state) => ({
          properties: state.properties.map((prop) =>
            prop.spaceId === spaceId ? { ...prop, custodianId } : prop
          ),
        }));
      },

      updateCollectivizationLevel: (spaceId, level) => {
        set((state) => ({
          properties: state.properties.map((prop) =>
            prop.spaceId === spaceId ? { ...prop, collectivizationLevel: level } : prop
          ),
        }));
      },

      // Turn management
      rollDice: () => {
        const die1 = Math.floor(Math.random() * 6) + 1;
        const die2 = Math.floor(Math.random() * 6) + 1;

        set({
          dice: [die1, die2],
          isRolling: true,
          hasRolled: true,
          turnPhase: 'rolling',
        });

        get().addLogEntry({
          type: 'dice',
          message: `Rolled ${die1} + ${die2} = ${die1 + die2}`,
          playerId: get().players[get().currentPlayerIndex].id,
        });
      },

      finishRolling: () => {
        const { dice, doublesCount } = get();
        const [die1, die2] = dice;
        const isDoubles = die1 === die2;
        const newDoublesCount = isDoubles ? doublesCount + 1 : 0;

        // Check for three doubles (counter-revolutionary behavior)
        if (newDoublesCount >= 3) {
          const currentPlayer = get().players[get().currentPlayerIndex];
          get().addLogEntry({
            type: 'gulag',
            message: `${currentPlayer.name} rolled three doubles - counter-revolutionary dice behavior!`,
            playerId: currentPlayer.id,
          });
          get().sendToGulag(currentPlayer.id, 'Three doubles - counter-revolutionary behavior');
          set({ isRolling: false, doublesCount: 0 });
          return;
        }

        set({
          isRolling: false,
          doublesCount: newDoublesCount,
          turnPhase: 'moving',
        });

        // Move the player
        const currentPlayer = get().players[get().currentPlayerIndex];
        const total = die1 + die2;
        get().movePlayer(currentPlayer.id, total);
      },

      movePlayer: (playerId, spaces) => {
        const state = get();
        const player = state.players.find((p) => p.id === playerId);
        if (!player) return;

        const oldPosition = player.position;
        const newPosition = (oldPosition + spaces) % 40;

        // Check if player passed STOY (position 0)
        const passedStoy = oldPosition !== 0 && (oldPosition + spaces >= 40);

        // Update player position
        get().updatePlayer(playerId, { position: newPosition });

        get().addLogEntry({
          type: 'movement',
          message: `${player.name} moved from ${getSpaceById(oldPosition)?.name} to ${getSpaceById(newPosition)?.name}`,
          playerId,
        });

        // Handle passing STOY
        if (passedStoy && newPosition !== 0) {
          get().handleStoyPassing(playerId);
        }
      },

      finishMoving: () => {
        const state = get();
        const currentPlayer = state.players[state.currentPlayerIndex];
        const space = getSpaceById(currentPlayer.position);

        set({ turnPhase: 'resolving' });

        // Handle landing on the space
        if (!space) return;

        switch (space.type) {
          case 'corner':
            if (space.id === 0 && currentPlayer.position === 0) {
              // Landed exactly on STOY - pilfering opportunity
              set({ pendingAction: { type: 'stoy-pilfer' } });
            } else if (space.id === 10) {
              // The Gulag - just visiting
              get().addLogEntry({
                type: 'movement',
                message: `${currentPlayer.name} is just visiting the Gulag`,
                playerId: currentPlayer.id,
              });
              set({ turnPhase: 'post-turn' });
            } else if (space.id === 20) {
              // Breadline - placeholder for now
              get().addLogEntry({
                type: 'system',
                message: `${currentPlayer.name} landed on Breadline (implementation coming in later milestone)`,
                playerId: currentPlayer.id,
              });
              set({ turnPhase: 'post-turn' });
            } else if (space.id === 30) {
              // Enemy of the State - go to Gulag
              get().sendToGulag(currentPlayer.id, 'Landed on Enemy of the State');
            }
            break;

          case 'property':
          case 'railway':
          case 'utility':
            // Will be handled in Milestone 4
            get().addLogEntry({
              type: 'system',
              message: `${currentPlayer.name} landed on ${space.name} (property system coming in Milestone 4)`,
              playerId: currentPlayer.id,
            });
            set({ turnPhase: 'post-turn' });
            break;

          case 'tax':
          case 'card':
            // Placeholder for future milestones
            get().addLogEntry({
              type: 'system',
              message: `${currentPlayer.name} landed on ${space.name} (implementation coming in later milestone)`,
              playerId: currentPlayer.id,
            });
            set({ turnPhase: 'post-turn' });
            break;

          default:
            set({ turnPhase: 'post-turn' });
        }
      },

      setTurnPhase: (phase) => set({ turnPhase: phase }),

      endTurn: () => {
        const state = get();
        const { currentPlayerIndex, players, doublesCount } = state;

        // If player rolled doubles and not in gulag, they get another turn
        if (doublesCount > 0 && !players[currentPlayerIndex].inGulag) {
          set({
            turnPhase: 'pre-roll',
            hasRolled: false,
            pendingAction: null,
          });
          return;
        }

        // Find next player (skip Stalin and players in Gulag)
        let nextIndex = (currentPlayerIndex + 1) % players.length;
        let attempts = 0;

        while (
          (players[nextIndex].isStalin || players[nextIndex].inGulag || players[nextIndex].isEliminated) &&
          attempts < players.length
        ) {
          nextIndex = (nextIndex + 1) % players.length;
          attempts++;
        }

        set({
          currentPlayerIndex: nextIndex,
          turnPhase: 'pre-roll',
          doublesCount: 0,
          hasRolled: false,
          pendingAction: null,
        });

        get().addLogEntry({
          type: 'system',
          message: `${players[nextIndex].name}'s turn`,
          playerId: players[nextIndex].id,
        });
      },

      // Gulag management
      sendToGulag: (playerId, reason) => {
        const state = get();
        const player = state.players.find((p) => p.id === playerId);
        if (!player) return;

        get().updatePlayer(playerId, {
          inGulag: true,
          gulagTurns: 0,
          position: 10, // Gulag position
        });

        // Demote player
        get().demotePlayer(playerId);

        get().addLogEntry({
          type: 'gulag',
          message: `${player.name} sent to Gulag: ${reason}`,
          playerId,
        });

        // End turn immediately
        set({ turnPhase: 'post-turn' });
      },

      demotePlayer: (playerId) => {
        const state = get();
        const player = state.players.find((p) => p.id === playerId);
        if (!player) return;

        const rankOrder: Player['rank'][] = ['proletariat', 'partyMember', 'commissar', 'innerCircle'];
        const currentRankIndex = rankOrder.indexOf(player.rank);

        if (currentRankIndex > 0) {
          const newRank = rankOrder[currentRankIndex - 1];
          get().updatePlayer(playerId, { rank: newRank });
          get().addLogEntry({
            type: 'rank',
            message: `${player.name} demoted to ${newRank}`,
            playerId,
          });
        }
      },

      // STOY handling
      handleStoyPassing: (playerId) => {
        const state = get();
        const player = state.players.find((p) => p.id === playerId);
        if (!player) return;

        // Deduct 200₽ travel tax
        get().updatePlayer(playerId, { rubles: player.rubles - 200 });
        get().adjustTreasury(200);

        get().addLogEntry({
          type: 'payment',
          message: `${player.name} paid ₽200 travel tax at STOY`,
          playerId,
        });
      },

      handleStoyPilfer: (playerId, diceRoll) => {
        const state = get();
        const player = state.players.find((p) => p.id === playerId);
        if (!player) return;

        if (diceRoll >= 4) {
          // Success! Steal 100₽ from State
          get().updatePlayer(playerId, { rubles: player.rubles + 100 });
          get().adjustTreasury(-100);

          get().addLogEntry({
            type: 'payment',
            message: `${player.name} successfully pilfered ₽100 from the State Treasury!`,
            playerId,
          });
        } else {
          // Caught! Go to Gulag
          get().sendToGulag(playerId, 'Caught pilfering at STOY checkpoint');
        }

        set({ pendingAction: null, turnPhase: 'post-turn' });
      },

      // Game log
      addLogEntry: (entry) => {
        const newEntry: LogEntry = {
          ...entry,
          id: `log-${Date.now()}-${Math.random()}`,
          timestamp: new Date(),
        };

        set((state) => ({
          gameLog: [...state.gameLog, newEntry].slice(-50), // Keep last 50 entries
        }));
      },

      // Treasury
      adjustTreasury: (amount) => {
        set((state) => ({
          stateTreasury: Math.max(0, state.stateTreasury + amount),
        }));
      },
    }),
    {
      name: 'communistopoly-save',
      partialize: (state) => ({
        gamePhase: state.gamePhase,
        players: state.players,
        stalinPlayerId: state.stalinPlayerId,
        currentPlayerIndex: state.currentPlayerIndex,
        properties: state.properties,
        stateTreasury: state.stateTreasury,
        turnPhase: state.turnPhase,
        doublesCount: state.doublesCount,
        hasRolled: state.hasRolled,
        dice: state.dice,
        gameLog: state.gameLog,
      }),
    }
  )
);
