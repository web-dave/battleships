import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { GameStore } from './game-store';

describe('GameStore', () => {
  let store: GameStore;

  beforeEach(() => {
    // Mock localStorage before each test
    const localStorageMock = (() => {
      let data: Record<string, string> = {};
      return {
        getItem: (key: string) => data[key] ?? null,
        setItem: (key: string, value: string) => { data[key] = value; },
        removeItem: (key: string) => { delete data[key]; },
        clear: () => { data = {}; },
      };
    })();
    vi.stubGlobal('localStorage', localStorageMock);

    TestBed.configureTestingModule({ providers: [GameStore] });
    store = TestBed.inject(GameStore);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('should have correct initial state', () => {
    const state = store.state();
    expect(state.gameId).toBeNull();
    expect(state.playerName).toBe('');
    expect(state.opponentId).toBeNull();
    expect(state.opponentName).toBe('');
    expect(state.myShips).toEqual([]);
    expect(state.myShots).toEqual([]);
    expect(state.opponentShots).toEqual([]);
    expect(state.isMyTurn).toBe(false);
    expect(state.status).toBe('Welcome to Battleship');
    expect(state.gameStatus).toBe('waiting');
    expect(state.winner).toBeNull();
    expect(state.view).toBe('lobby');
  });

  describe('computed selectors', () => {
    it('view() should return current view', () => {
      expect(store.view()).toBe('lobby');
    });

    it('status() should return current status', () => {
      expect(store.status()).toBe('Welcome to Battleship');
    });

    it('myShips() should return empty array initially', () => {
      expect(store.myShips()).toEqual([]);
    });

    it('myShots() should return empty array initially', () => {
      expect(store.myShots()).toEqual([]);
    });

    it('opponentShots() should return empty array initially', () => {
      expect(store.opponentShots()).toEqual([]);
    });

    it('isMyTurn() should be false initially', () => {
      expect(store.isMyTurn()).toBe(false);
    });

    it('playerId() should return null initially', () => {
      expect(store.playerId()).toBeNull();
    });

    it('playerName() should return empty string initially', () => {
      expect(store.playerName()).toBe('');
    });

    it('opponentId() should return null initially', () => {
      expect(store.opponentId()).toBeNull();
    });

    it('opponentName() should return empty string initially', () => {
      expect(store.opponentName()).toBe('');
    });

    it('winner() should return null initially', () => {
      expect(store.winner()).toBeNull();
    });

    it('iWon() should be false when no winner set', () => {
      expect(store.iWon()).toBe(false);
    });

    it('iWon() should be true when winner matches playerId', () => {
      store.updateState({ playerId: 'p1', winner: 'p1' });
      expect(store.iWon()).toBe(true);
    });

    it('iWon() should be false when winner is opponent', () => {
      store.updateState({ playerId: 'p1', winner: 'p2' });
      expect(store.iWon()).toBe(false);
    });
  });

  describe('updateState', () => {
    it('should partially update the state', () => {
      store.updateState({ status: 'New Status' });
      expect(store.status()).toBe('New Status');
    });

    it('should merge partial updates without losing other fields', () => {
      store.updateState({ status: 'Test' });
      store.updateState({ view: 'setup' });
      expect(store.status()).toBe('Test');
      expect(store.view()).toBe('setup');
    });
  });

  describe('setGameInit', () => {
    it('should update game state and persist player_id to localStorage', () => {
      store.setGameInit(42, 'player-abc', 'player1', 'Alice');
      expect(store.state().gameId).toBe(42);
      expect(store.state().playerId).toBe('player-abc');
      expect(store.state().playerName).toBe('Alice');
      expect(store.view()).toBe('setup');
      expect(store.status()).toBe('Place your ships');
      expect(localStorage.getItem('player_id')).toBe('player-abc');
    });

    it('should set gameStatus to "active" for player2', () => {
      store.setGameInit(1, 'pid', 'player2', 'Bob');
      expect(store.state().gameStatus).toBe('active');
    });

    it('should set gameStatus to "waiting" for player1', () => {
      store.setGameInit(1, 'pid', 'player1', 'Alice');
      expect(store.state().gameStatus).toBe('waiting');
    });

    it('should reset myShips, myShots, opponentShots and winner', () => {
      store.updateState({ myShips: [{ x: 0, y: 0, size: 5 }], winner: 'pid' });
      store.setGameInit(1, 'pid', 'player1', 'Alice');
      expect(store.state().myShips).toEqual([]);
      expect(store.state().myShots).toEqual([]);
      expect(store.state().opponentShots).toEqual([]);
      expect(store.state().winner).toBeNull();
    });

    it('should persist player_name to localStorage when provided', () => {
      store.setGameInit(1, 'pid', 'player1', 'Alice');
      expect(localStorage.getItem('player_name')).toBe('Alice');
    });

    it('should keep existing playerName when empty name provided', () => {
      store.updateState({ playerName: 'Alice' });
      store.setGameInit(1, 'pid', 'player1', '');
      expect(store.state().playerName).toBe('Alice');
    });
  });

  describe('setShipsPlaced', () => {
    it('should update ships, view and status', () => {
      const ships = [{ x: 0, y: 0, size: 5, orientation: 'horizontal', hits: 0 }];
      store.setShipsPlaced(ships);
      expect(store.state().myShips).toEqual(ships);
      expect(store.view()).toBe('game');
      expect(store.status()).toBe('Waiting for opponent...');
    });
  });

  describe('updateGameStatus', () => {
    beforeEach(() => {
      store.updateState({ playerId: 'p1', view: 'game' });
    });

    it('should set isMyTurn to true when current_turn matches playerId', () => {
      store.updateGameStatus({ current_turn: 'p1', game_status: 'active', my_shots: [], opponent_shots: [] });
      expect(store.isMyTurn()).toBe(true);
    });

    it('should set isMyTurn to false when current_turn does not match', () => {
      store.updateGameStatus({ current_turn: 'p2', game_status: 'active', my_shots: [], opponent_shots: [] });
      expect(store.isMyTurn()).toBe(false);
    });

    it('should set status to "Your Turn!" when it is my turn', () => {
      store.updateGameStatus({ current_turn: 'p1', game_status: 'active', my_shots: [], opponent_shots: [] });
      expect(store.status()).toBe('Your Turn!');
    });

    it("should set status to \"Opponent's Turn\" when it is not my turn", () => {
      store.updateGameStatus({ current_turn: 'p2', game_status: 'active', my_shots: [], opponent_shots: [] });
      expect(store.status()).toBe("Opponent's Turn");
    });

    it('should update myShots and opponentShots', () => {
      const myShots = [{ x: 1, y: 2, result: 'hit', ship_id: 1 }];
      const oppShots = [{ x: 3, y: 4, result: 'miss', ship_id: null }];
      store.updateGameStatus({ current_turn: 'p2', game_status: 'active', my_shots: myShots, opponent_shots: oppShots });
      expect(store.myShots()).toEqual(myShots);
      expect(store.opponentShots()).toEqual(oppShots);
    });

    it('should update opponentId and opponentName', () => {
      store.updateGameStatus({ current_turn: 'p2', game_status: 'active', my_shots: [], opponent_shots: [], opponent_id: 'p2', opponent_name: 'Bob' });
      expect(store.opponentId()).toBe('p2');
      expect(store.opponentName()).toBe('Bob');
    });

    it('should set view to "gameover" and winner when game_status is "finished"', () => {
      store.updateGameStatus({ current_turn: 'p2', game_status: 'finished', my_shots: [], opponent_shots: [], winner: 'p2' });
      expect(store.view()).toBe('gameover');
      expect(store.winner()).toBe('p2');
    });

    it('should set winning status message when I won', () => {
      store.updateGameStatus({ current_turn: 'p1', game_status: 'finished', my_shots: [], opponent_shots: [], winner: 'p1' });
      expect(store.status()).toBe('You Won! 🎉');
    });

    it('should set losing status message when I lost', () => {
      store.updateGameStatus({ current_turn: 'p2', game_status: 'finished', my_shots: [], opponent_shots: [], winner: 'p2' });
      expect(store.status()).toBe('You Lost! 💀');
    });

    it('should update view from lobby to game when game_status is not waiting', () => {
      store.updateState({ view: 'lobby' });
      store.updateGameStatus({ current_turn: 'p2', game_status: 'active', my_shots: [], opponent_shots: [] });
      expect(store.view()).toBe('game');
    });

    it('should update my_ships from response when different from local', () => {
      const newShips = [{ x: 1, y: 2, size: 3, orientation: 'vertical' }];
      store.updateGameStatus({ current_turn: 'p2', game_status: 'active', my_shots: [], opponent_shots: [], my_ships: newShips });
      expect(store.myShips()).toEqual(newShips);
    });

    it('should not update my_ships when response ships match local ships', () => {
      const ships = [{ x: 1, y: 2, size: 3, orientation: 'vertical' }];
      store.updateState({ myShips: ships });
      const spy = vi.spyOn(store, 'updateState');
      store.updateGameStatus({ current_turn: 'p2', game_status: 'active', my_shots: [], opponent_shots: [], my_ships: ships });
      // Ships are the same, so myShips key should not be in the updates
      const callArgs = spy.mock.calls[0][0];
      expect(callArgs).not.toHaveProperty('myShips');
    });
  });

  describe('addShot', () => {
    it('should add a shot to myShots', () => {
      store.addShot(3, 5, 'hit', 1);
      expect(store.myShots()).toEqual([{ x: 3, y: 5, result: 'hit', ship_id: 1 }]);
    });

    it('should add a miss shot with null ship_id by default', () => {
      store.addShot(2, 4, 'miss');
      expect(store.myShots()[0]).toEqual({ x: 2, y: 4, result: 'miss', ship_id: null });
    });

    it('should set isMyTurn to false after shot', () => {
      store.updateState({ isMyTurn: true });
      store.addShot(0, 0, 'miss');
      expect(store.isMyTurn()).toBe(false);
    });

    it('should update status with shot result', () => {
      store.addShot(1, 1, 'sunk', 2);
      expect(store.status()).toBe('Shot fired: sunk');
    });

    it('should accumulate multiple shots', () => {
      store.addShot(0, 0, 'miss');
      store.addShot(1, 1, 'hit', 1);
      expect(store.myShots()).toHaveLength(2);
    });
  });
});
