import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { GameService } from './game';

describe('GameService', () => {
  let service: GameService;
  let httpMock: HttpTestingController;
  const apiUrl = 'https://battleshipsapi.webdave.de';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GameService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(GameService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initGame', () => {
    it('should POST to init_game.php with no args when no playerId/playerName given', () => {
      service.initGame().subscribe();
      const req = httpMock.expectOne(`${apiUrl}/init_game.php`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush({ game_id: 1, player_id: 'abc', role: 'player1' });
    });

    it('should POST to init_game.php with player_id when provided', () => {
      service.initGame('pid123').subscribe();
      const req = httpMock.expectOne(`${apiUrl}/init_game.php`);
      expect(req.request.body).toEqual({ player_id: 'pid123' });
      req.flush({});
    });

    it('should POST to init_game.php with player_name when provided', () => {
      service.initGame(undefined, 'Alice').subscribe();
      const req = httpMock.expectOne(`${apiUrl}/init_game.php`);
      expect(req.request.body).toEqual({ player_name: 'Alice' });
      req.flush({});
    });

    it('should POST to init_game.php with both player_id and player_name when both provided', () => {
      service.initGame('pid123', 'Alice').subscribe();
      const req = httpMock.expectOne(`${apiUrl}/init_game.php`);
      expect(req.request.body).toEqual({ player_id: 'pid123', player_name: 'Alice' });
      req.flush({ game_id: 1, player_id: 'pid123', role: 'player1', player_name: 'Alice' });
    });

    it('should return an Observable with the response', () => {
      const mockResponse = { game_id: 42, player_id: 'abc', role: 'player1' };
      let result: any;
      service.initGame().subscribe((res) => (result = res));
      const req = httpMock.expectOne(`${apiUrl}/init_game.php`);
      req.flush(mockResponse);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('placeShips', () => {
    it('should POST to place_ships.php with correct body', () => {
      const ships = [{ x: 0, y: 0, size: 5, orientation: 'horizontal', hits: 0 }];
      service.placeShips(1, 'pid', ships).subscribe();
      const req = httpMock.expectOne(`${apiUrl}/place_ships.php`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ game_id: 1, player_id: 'pid', ships });
      req.flush({ status: 'ok' });
    });

    it('should return an Observable with the response', () => {
      const mockResponse = { status: 'ok' };
      let result: any;
      service.placeShips(1, 'pid', []).subscribe((res) => (result = res));
      const req = httpMock.expectOne(`${apiUrl}/place_ships.php`);
      req.flush(mockResponse);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('fire', () => {
    it('should POST to fire.php with correct body', () => {
      service.fire(1, 'pid', 3, 7).subscribe();
      const req = httpMock.expectOne(`${apiUrl}/fire.php`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ game_id: 1, player_id: 'pid', x: 3, y: 7 });
      req.flush({ status: 'ok', result: 'hit' });
    });

    it('should return an Observable with the fire response', () => {
      const mockResponse = { status: 'ok', result: 'miss' };
      let result: any;
      service.fire(1, 'pid', 0, 0).subscribe((res) => (result = res));
      const req = httpMock.expectOne(`${apiUrl}/fire.php`);
      req.flush(mockResponse);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getStatus', () => {
    it('should GET game_status.php with game_id and player_id as query params', () => {
      service.getStatus(1, 'pid').subscribe();
      const req = httpMock.expectOne(`${apiUrl}/game_status.php?game_id=1&player_id=pid`);
      expect(req.request.method).toBe('GET');
      req.flush({ game_status: 'active' });
    });

    it('should return an Observable with the status response', () => {
      const mockResponse = { game_status: 'finished', winner: 'pid' };
      let result: any;
      service.getStatus(5, 'abc').subscribe((res) => (result = res));
      const req = httpMock.expectOne(`${apiUrl}/game_status.php?game_id=5&player_id=abc`);
      req.flush(mockResponse);
      expect(result).toEqual(mockResponse);
    });
  });
});
