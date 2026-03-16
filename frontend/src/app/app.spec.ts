import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { App } from './app';
import { GameService } from './services/game';
import { GameStore } from './store/game-store';
import { of, throwError } from 'rxjs';

const mockGameService = {
  initGame: vi.fn(),
  placeShips: vi.fn(),
  fire: vi.fn(),
  getStatus: vi.fn(),
};

describe('App', () => {
  let component: App;
  let fixture: ComponentFixture<App>;
  let store: GameStore;

  beforeEach(async () => {
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

    vi.resetAllMocks();

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: GameService, useValue: mockGameService },
        GameStore,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;
    store = TestBed.inject(GameStore);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    component.ngOnDestroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize shipsToPlace correctly', () => {
    expect(component.shipsToPlace).toEqual([5, 4, 3, 3, 2]);
  });

  it('should initialize currentShipIndex to 0', () => {
    expect(component.currentShipIndex).toBe(0);
  });

  it('should initialize orientation to "horizontal"', () => {
    expect(component.orientation).toBe('horizontal');
  });

  describe('startGame()', () => {
    it('should show error when no name is entered and no stored name', () => {
      component.nameInput = '';
      component.startGame();
      expect(store.status()).toBe('Please enter your name first!');
    });

    it('should call initGame with stored player_id from localStorage', () => {
      localStorage.setItem('player_id', 'stored-pid');
      mockGameService.initGame.mockReturnValue(of({ game_id: 1, player_id: 'stored-pid', role: 'player1', player_name: 'Alice' }));
      component.nameInput = 'Alice';
      component.startGame();
      expect(mockGameService.initGame).toHaveBeenCalledWith('stored-pid', 'Alice');
    });

    it('should call initGame with undefined when no stored player_id', () => {
      mockGameService.initGame.mockReturnValue(of({ game_id: 1, player_id: 'new-pid', role: 'player1', player_name: 'Alice' }));
      component.nameInput = 'Alice';
      component.startGame();
      expect(mockGameService.initGame).toHaveBeenCalledWith(undefined, 'Alice');
    });

    it('should call setGameInit after successful initGame', () => {
      const spy = vi.spyOn(store, 'setGameInit');
      mockGameService.initGame.mockReturnValue(of({ game_id: 42, player_id: 'pid', role: 'player1', player_name: 'Alice' }));
      component.nameInput = 'Alice';
      component.startGame();
      expect(spy).toHaveBeenCalledWith(42, 'pid', 'player1', 'Alice');
    });

    it('should reset currentShipIndex to 0 on successful start', () => {
      component.currentShipIndex = 3;
      mockGameService.initGame.mockReturnValue(of({ game_id: 1, player_id: 'pid', role: 'player1', player_name: 'Alice' }));
      component.nameInput = 'Alice';
      component.startGame();
      expect(component.currentShipIndex).toBe(0);
    });

    it('should show error status when initGame fails', () => {
      mockGameService.initGame.mockReturnValue(throwError(() => ({ message: 'Network error' })));
      component.nameInput = 'Alice';
      component.startGame();
      expect(store.status()).toBe('Error connecting: Network error');
    });

    it('should use playerName from store when nameInput is empty', () => {
      store.updateState({ playerName: 'Bob' });
      mockGameService.initGame.mockReturnValue(of({ game_id: 1, player_id: 'pid', role: 'player1', player_name: 'Bob' }));
      component.nameInput = '';
      component.startGame();
      expect(mockGameService.initGame).toHaveBeenCalledWith(undefined, 'Bob');
    });
  });

  describe('toggleOrientation()', () => {
    it('should toggle from horizontal to vertical', () => {
      component.orientation = 'horizontal';
      component.toggleOrientation();
      expect(component.orientation).toBe('vertical');
    });

    it('should toggle from vertical to horizontal', () => {
      component.orientation = 'vertical';
      component.toggleOrientation();
      expect(component.orientation).toBe('horizontal');
    });
  });

  describe('canPlaceShip()', () => {
    it('should return false when horizontal ship exceeds grid width', () => {
      expect(component.canPlaceShip(8, 0, 5, 'horizontal')).toBe(false);
    });

    it('should return false when vertical ship exceeds grid height', () => {
      expect(component.canPlaceShip(0, 8, 5, 'vertical')).toBe(false);
    });

    it('should return true for valid horizontal placement', () => {
      expect(component.canPlaceShip(0, 0, 5, 'horizontal')).toBe(true);
    });

    it('should return true for valid vertical placement', () => {
      expect(component.canPlaceShip(0, 0, 5, 'vertical')).toBe(true);
    });

    it('should return false when ship overlaps existing ship', () => {
      store.updateState({ myShips: [{ x: 0, y: 0, size: 3, orientation: 'horizontal', hits: 0 }] });
      expect(component.canPlaceShip(1, 0, 2, 'horizontal')).toBe(false);
    });

    it('should return true when ship does not overlap existing ships', () => {
      store.updateState({ myShips: [{ x: 0, y: 0, size: 3, orientation: 'horizontal', hits: 0 }] });
      expect(component.canPlaceShip(0, 2, 3, 'horizontal')).toBe(true);
    });

    it('should detect overlap with vertical existing ship', () => {
      store.updateState({ myShips: [{ x: 2, y: 0, size: 3, orientation: 'vertical', hits: 0 }] });
      expect(component.canPlaceShip(0, 1, 3, 'horizontal')).toBe(false);
    });
  });

  describe('onSetupClick()', () => {
    it('should do nothing when all ships are already placed', () => {
      component.currentShipIndex = component.shipsToPlace.length;
      const spy = vi.spyOn(store, 'updateState');
      component.onSetupClick({ x: 0, y: 0 });
      expect(spy).not.toHaveBeenCalled();
    });

    it('should add ship to store when placement is valid', () => {
      component.currentShipIndex = 0;
      component.orientation = 'horizontal';
      component.onSetupClick({ x: 0, y: 0 });
      expect(store.myShips()).toHaveLength(1);
      expect(store.myShips()[0]).toMatchObject({ x: 0, y: 0, size: 5, orientation: 'horizontal' });
    });

    it('should increment currentShipIndex after valid placement', () => {
      component.currentShipIndex = 0;
      component.onSetupClick({ x: 0, y: 0 });
      expect(component.currentShipIndex).toBe(1);
    });

    it('should show invalid placement message when placement is invalid', async () => {
      vi.useFakeTimers();
      component.currentShipIndex = 0;
      component.orientation = 'horizontal';
      // Place ship at x=8, size=5 - this will exceed the grid
      component.onSetupClick({ x: 8, y: 0 });
      expect(store.status()).toBe('Invalid placement!');
      await vi.runAllTimersAsync();
      expect(store.status()).toBe('Place your ships');
      vi.useRealTimers();
    });

    it('should call finishSetup when last ship is placed', () => {
      const spy = vi.spyOn(component as any, 'finishSetup');
      component.currentShipIndex = component.shipsToPlace.length - 1;
      mockGameService.placeShips.mockReturnValue(of({}));
      store.updateState({ gameId: 1, playerId: 'pid' });
      // Place last ship (size 2)
      component.orientation = 'horizontal';
      component.onSetupClick({ x: 0, y: 5 });
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('finishSetup()', () => {
    it('should call placeShips service and update store', () => {
      store.updateState({ gameId: 1, playerId: 'pid', myShips: [] });
      mockGameService.placeShips.mockReturnValue(of({}));
      (component as any).finishSetup();
      expect(mockGameService.placeShips).toHaveBeenCalledWith(1, 'pid', []);
      expect(store.view()).toBe('game');
    });
  });

  describe('onGameClick()', () => {
    it('should not fire when it is not my turn', () => {
      store.updateState({ isMyTurn: false, gameId: 1, playerId: 'pid' });
      component.onGameClick({ x: 3, y: 5 });
      expect(mockGameService.fire).not.toHaveBeenCalled();
    });

    it('should not fire on already shot cell', () => {
      store.updateState({ isMyTurn: true, gameId: 1, playerId: 'pid', myShots: [{ x: 3, y: 5, result: 'hit', ship_id: 1 }] });
      component.onGameClick({ x: 3, y: 5 });
      expect(mockGameService.fire).not.toHaveBeenCalled();
    });

    it('should fire when it is my turn and cell is not already shot', () => {
      store.updateState({ isMyTurn: true, gameId: 1, playerId: 'pid', myShots: [] });
      mockGameService.fire.mockReturnValue(of({ status: 'ok', result: 'hit', ship_id: 1 }));
      component.onGameClick({ x: 3, y: 5 });
      expect(mockGameService.fire).toHaveBeenCalledWith(1, 'pid', 3, 5);
    });

    it('should add shot to store when fire succeeds', () => {
      store.updateState({ isMyTurn: true, gameId: 1, playerId: 'pid', myShots: [] });
      mockGameService.fire.mockReturnValue(of({ status: 'ok', result: 'miss', ship_id: null }));
      component.onGameClick({ x: 2, y: 4 });
      expect(store.myShots()).toContainEqual({ x: 2, y: 4, result: 'miss', ship_id: null });
    });
  });

  describe('startPolling()', () => {
    it('should reset to lobby and clear gameId when getStatus returns an error', async () => {
      store.updateState({ gameId: 1, playerId: 'pid' });
      mockGameService.getStatus.mockReturnValue(throwError(() => new Error('Not Found')));
      vi.useFakeTimers();
      (component as any).startPolling();
      await vi.advanceTimersByTimeAsync(1000);
      expect(store.view()).toBe('lobby');
      expect(store.state().gameId).toBeNull();
      expect(store.status()).toContain('expired');
      vi.useRealTimers();
    });

    it('should update game status on successful poll', async () => {
      store.updateState({ gameId: 1, playerId: 'pid' });
      mockGameService.getStatus.mockReturnValue(of({ game_status: 'active', current_turn: 'other', my_shots: [], opponent_shots: [] }));
      vi.useFakeTimers();
      (component as any).startPolling();
      await vi.advanceTimersByTimeAsync(1000);
      expect(store.state().gameStatus).toBe('active');
      vi.useRealTimers();
    });

    it('should unsubscribe and clear pollSubscription when getStatus errors', async () => {
      store.updateState({ gameId: 1, playerId: 'pid' });
      mockGameService.getStatus.mockReturnValue(throwError(() => new Error('Not Found')));
      vi.useFakeTimers();
      (component as any).startPolling();
      await vi.advanceTimersByTimeAsync(1000);
      expect((component as any).pollSubscription).toBeUndefined();
      vi.useRealTimers();
    });
  });

  describe('ngOnDestroy()', () => {
    it('should unsubscribe pollSubscription on destroy', () => {
      (component as any).pollSubscription = { unsubscribe: vi.fn() };
      component.ngOnDestroy();
      expect((component as any).pollSubscription.unsubscribe).toHaveBeenCalled();
    });

    it('should not throw when pollSubscription is undefined', () => {
      (component as any).pollSubscription = undefined;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
