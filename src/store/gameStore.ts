import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState, Player, Property, GamePhase } from '../types/game';
import { BOARD_SPACES } from '../data/spaces';

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
      }),
    }
  )
);
