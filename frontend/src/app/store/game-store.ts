import { Injectable, signal, computed, effect } from '@angular/core';

export interface GameState {
  gameId: number | null;
  playerId: string | null;
  playerName: string;
  opponentId: string | null;
  opponentName: string;
  myShips: any[];
  myShots: any[];
  opponentShots: any[];
  isMyTurn: boolean;
  status: string;
  gameStatus: 'waiting' | 'active' | 'finished';
  winner: string | null;
  view: 'lobby' | 'setup' | 'game' | 'gameover';
}

const initialState: GameState = {
  gameId: null,
  playerId: localStorage.getItem('player_id'),
  playerName: localStorage.getItem('player_name') || '',
  opponentId: null,
  opponentName: '',
  myShips: [],
  myShots: [],
  opponentShots: [],
  isMyTurn: false,
  status: 'Welcome to Battleship',
  gameStatus: 'waiting',
  winner: null,
  view: 'lobby',
};

@Injectable({
  providedIn: 'root',
})
export class GameStore {
  // State Signal
  readonly state = signal<GameState>(initialState);

  readonly debugEffect = effect(() => {
    console.log('State changed:', this.state());
  });

  // Computed Selectors
  readonly view = computed(() => this.state().view);
  readonly status = computed(() => this.state().status);
  readonly myShips = computed(() => this.state().myShips);
  readonly myShots = computed(() => this.state().myShots);
  readonly opponentShots = computed(() => this.state().opponentShots);
  readonly isMyTurn = computed(() => this.state().isMyTurn);
  readonly playerId = computed(() => this.state().playerId);
  readonly playerName = computed(() => this.state().playerName);
  readonly opponentId = computed(() => this.state().opponentId);
  readonly opponentName = computed(() => this.state().opponentName);
  readonly winner = computed(() => this.state().winner);
  readonly iWon = computed(() => this.state().winner !== null && this.state().winner === this.state().playerId);

  // Actions
  updateState(partial: Partial<GameState>) {
    this.state.update((current) => ({ ...current, ...partial }));
  }

  setGameInit(gameId: number, playerId: string, role: string, playerName: string) {
    localStorage.setItem('player_id', playerId);
    if (playerName) {
      localStorage.setItem('player_name', playerName);
    }
    this.updateState({
      gameId,
      playerId,
      playerName: playerName || this.state().playerName,
      gameStatus: role === 'player2' ? 'active' : 'waiting',
      view: 'setup',
      status: 'Place your ships',
      myShips: [],
      myShots: [],
      opponentShots: [],
      winner: null,
      isMyTurn: false,
    });
  }

  setShipsPlaced(ships: any[]) {
    this.updateState({
      myShips: ships,
      view: 'game',
      status: 'Waiting for opponent...',
    });
  }

  updateGameStatus(res: any) {
    const isMyTurn = res.current_turn === this.state().playerId;
    const baseStatus = isMyTurn ? 'Your Turn!' : "Opponent's Turn";

    const updates: Partial<GameState> = {
      isMyTurn,
      myShots: res.my_shots || [],
      opponentShots: res.opponent_shots || [],
      opponentId: res.opponent_id,
      opponentName: res.opponent_name || this.state().opponentName,
      status: baseStatus,
      gameStatus: res.game_status,
    };

    // If backend returns my_ships, update it (useful for reloads or validation)
    // Only update if we don't have ships locally, or if the count matches (sync), or force it.
    // For now, let's trust the backend if it has data.
    if (res.my_ships && res.my_ships.length > 0) {
      // Optional: Deep compare or check if length changed to avoid unnecessary renders
      // But for signals, setting the same value is fine, it handles equality check by default (ref equality)
      // Since API returns new objects every time, we might want to check length or JSON stringify
      const currentShips = this.state().myShips;
      if (JSON.stringify(currentShips) !== JSON.stringify(res.my_ships)) {
        updates.myShips = res.my_ships;
      }
    }

    if (res.game_status === 'finished') {
      const iWon = res.winner === this.state().playerId;
      updates.view = 'gameover';
      updates.winner = res.winner ?? null;
      updates.status = iWon ? 'You Won! 🎉' : 'You Lost! 💀';
    } else if (this.state().view === 'lobby' && res.game_status !== 'waiting') {
      updates.view = 'game';
    }

    this.updateState(updates);
  }

  addShot(x: number, y: number, result: string, ship_id: number | null = null) {
    const newShots = [...this.state().myShots, { x, y, result, ship_id }];
    this.updateState({
      myShots: newShots,
      isMyTurn: false,
      status: `Shot fired: ${result}`,
    });
  }
}
