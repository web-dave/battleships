import {
  Component,
  Input,
  Output,
  EventEmitter,
  effect,
  output,
  input,
  signal,
  computed,
  OnInit,
  Signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { classMap } from '../../services/game';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './board.html',
  styleUrls: ['./board.css'],
})
export class BoardComponent {
  size = input(10);
  shots = input<{ ship_id: number; x: number; y: number; result: string }[]>([]);
  ships = input<{ id: number; x: number; y: number; size: number; orientation: string }[]>([]);
  isInteractive = input(false);
  cellClick = output<{ x: number; y: number }>();

  grid = computed(() =>
    Array(this.size())
      .fill(0)
      .map((x, i) => i),
  );

  cellClassList = computed(() => {
    const shots = this.shots();
    const ships = this.ships();
    const cellList: { [key: string]: string } = {};
    this.grid().forEach((x) => {
      this.grid().forEach((y) => {
        let cellClass = `cell ${x}${y}`;
        // Check if ship exists here (only for own board)
        const ship = ships.find((s) => {
          if (s.orientation === 'horizontal') {
            return y === s.y && x >= s.x && x < s.x + s.size;
          } else {
            return x === s.x && y >= s.y && y < s.y + s.size;
          }
        });
        if (!!ship) {
          cellClass += ' ship';
        } else {
          cellClass += ' water';
        }

        cellList[`${x}${y}`] = cellClass;
      });
    });
    shots.forEach((shot) => {
      if (shot.result === 'sunk') {
        const sunkShots = shots.filter((s) => s.ship_id == shot.ship_id);
        sunkShots.forEach((s) => {
          cellList[`${s.x}${s.y}`] += ' shot-sunk';
        });
      } else {
        cellList[`${shot.x}${shot.y}`] += ' shot-' + shot.result;
      }
    });
    return cellList;
  });

  onClick(x: number, y: number) {
    if (this.isInteractive()) {
      const alreadyShot = this.shots().some((s) => s.x === x && s.y === y);
      if (!alreadyShot) {
        this.cellClick.emit({ x, y });
      }
    }
  }
}
