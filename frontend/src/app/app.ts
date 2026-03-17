import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameService } from './services/game';
import { GameStore } from './store/game-store';
import { BoardComponent } from './components/board/board';
import { interval, Subscription, EMPTY } from 'rxjs';
import { switchMap, tap, filter, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, BoardComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnDestroy {
  shipsToPlace = [5, 4, 3, 3, 2];
  currentShipIndex = 0;
  orientation: 'horizontal' | 'vertical' = 'horizontal';
  nameInput = '';

  pollSubscription?: Subscription;

  constructor(
    private gameService: GameService,
    public store: GameStore,
  ) {}

  startGame() {
    const name = this.store.playerName() || this.nameInput.trim();
    if (!name) {
      this.store.updateState({ status: 'Please enter your name first!' });
      return;
    }
    this.store.updateState({ view: 'lobby', status: 'Connecting...' });
    const storedPid = localStorage.getItem('player_id');
    this.pollSubscription?.unsubscribe();
    this.pollSubscription = undefined;

    this.gameService.initGame(storedPid || undefined, name).subscribe({
      next: (res: any) => {
        this.store.setGameInit(res.game_id, res.player_id, res.role, res.player_name || name);
        // Reset local setup state
        this.currentShipIndex = 0;
        this.store.updateState({ myShips: [] });
      },
      error: (err) => this.store.updateState({ status: 'Error connecting: ' + err.message }),
    });
  }

  toggleOrientation() {
    this.orientation = this.orientation === 'horizontal' ? 'vertical' : 'horizontal';
  }

  onSetupClick(coords: { x: number; y: number }) {
    if (this.currentShipIndex >= this.shipsToPlace.length) return;

    const size = this.shipsToPlace[this.currentShipIndex];
    if (this.canPlaceShip(coords.x, coords.y, size, this.orientation)) {
      const newShip = {
        x: coords.x,
        y: coords.y,
        size,
        orientation: this.orientation,
        hits: 0,
      };

      const currentShips = this.store.state().myShips;
      this.store.updateState({ myShips: [...currentShips, newShip] });

      this.currentShipIndex++;

      if (this.currentShipIndex >= this.shipsToPlace.length) {
        this.finishSetup();
      }
    } else {
      this.store.updateState({ status: 'Invalid placement!' });
      setTimeout(() => this.store.updateState({ status: 'Place your ships' }), 1000);
    }
  }

  canPlaceShip(x: number, y: number, size: number, orientation: string): boolean {
    if (orientation === 'horizontal' && x + size > 10) return false;
    if (orientation === 'vertical' && y + size > 10) return false;

    const currentShips = this.store.state().myShips;
    for (const ship of currentShips) {
      const shipCells = [];
      for (let i = 0; i < ship.size; i++) {
        shipCells.push(
          ship.orientation === 'horizontal'
            ? { x: ship.x + i, y: ship.y }
            : { x: ship.x, y: ship.y + i },
        );
      }

      for (let i = 0; i < size; i++) {
        const cx = orientation === 'horizontal' ? x + i : x;
        const cy = orientation === 'vertical' ? y + i : y;
        if (shipCells.some((cell) => cell.x === cx && cell.y === cy)) return false;
      }
    }
    return true;
  }

  finishSetup() {
    const s = this.store.state();
    this.store.updateState({ status: 'Waiting for opponent...' });

    this.gameService.placeShips(s.gameId!, s.playerId!, s.myShips).subscribe(() => {
      this.store.setShipsPlaced(s.myShips);
      this.startPolling();
    });
  }

  onGameClick(coords: { x: number; y: number }) {
    const s = this.store.state();
    if (!s.isMyTurn) return;
    if (s.myShots.some((shot: any) => shot.x === coords.x && shot.y === coords.y)) return;

    this.gameService.fire(s.gameId!, s.playerId!, coords.x, coords.y).subscribe((res: any) => {
      if (res.status === 'ok') {
        this.store.addShot(coords.x, coords.y, res.result, res.ship_id);
      }
    });
  }

  startPolling() {
    if (this.pollSubscription) return;

    this.pollSubscription = interval(1000)
      .pipe(
        filter(() => !!this.store.state().gameId),
        switchMap(() => {
          const s = this.store.state();
          return this.gameService.getStatus(s.gameId!, s.playerId!).pipe(
            catchError(() => {
              this.pollSubscription?.unsubscribe();
              this.pollSubscription = undefined;
              this.store.updateState({
                view: 'lobby',
                gameId: null,
                status: 'Your game has expired due to inactivity.',
              });
              return EMPTY;
            }),
          );
        }),
      )
      .subscribe((res: any) => {
        this.store.updateGameStatus(res);
        if (res.game_status === 'finished') {
          this.pollSubscription?.unsubscribe();
        }
      });
  }

  ngOnDestroy() {
    this.pollSubscription?.unsubscribe();
  }
}
