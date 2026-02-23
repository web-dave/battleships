import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { BoardComponent } from './board';

describe('BoardComponent', () => {
  let component: BoardComponent;
  let fixture: ComponentFixture<BoardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('grid()', () => {
    it('should create a 10-element array by default', () => {
      expect(component.grid()).toHaveLength(10);
      expect(component.grid()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it('should create grid based on size input', () => {
      fixture.componentRef.setInput('size', 5);
      fixture.detectChanges();
      expect(component.grid()).toHaveLength(5);
    });
  });

  describe('cellClassList()', () => {
    it('should generate class strings for all cells', () => {
      const classList = component.cellClassList();
      expect(Object.keys(classList)).toHaveLength(100); // 10x10 grid
    });

    it('should assign "water" class to cells without ships', () => {
      const classList = component.cellClassList();
      expect(classList['00']).toContain('water');
    });

    it('should assign "ship" class to cells occupied by a horizontal ship', () => {
      fixture.componentRef.setInput('ships', [{ id: 1, x: 0, y: 0, size: 3, orientation: 'horizontal' }]);
      fixture.detectChanges();
      const classList = component.cellClassList();
      expect(classList['00']).toContain('ship');
      expect(classList['10']).toContain('ship');
      expect(classList['20']).toContain('ship');
      expect(classList['30']).not.toContain('ship');
    });

    it('should assign "ship" class to cells occupied by a vertical ship', () => {
      fixture.componentRef.setInput('ships', [{ id: 1, x: 0, y: 0, size: 3, orientation: 'vertical' }]);
      fixture.detectChanges();
      const classList = component.cellClassList();
      expect(classList['00']).toContain('ship');
      expect(classList['01']).toContain('ship');
      expect(classList['02']).toContain('ship');
      expect(classList['03']).not.toContain('ship');
    });

    it('should assign "shot-hit" class to hit cells', () => {
      fixture.componentRef.setInput('shots', [{ x: 3, y: 4, result: 'hit', ship_id: null }]);
      fixture.detectChanges();
      const classList = component.cellClassList();
      expect(classList['34']).toContain('shot-hit');
    });

    it('should assign "shot-miss" class to miss cells', () => {
      fixture.componentRef.setInput('shots', [{ x: 2, y: 5, result: 'miss', ship_id: null }]);
      fixture.detectChanges();
      const classList = component.cellClassList();
      expect(classList['25']).toContain('shot-miss');
    });

    it('should assign "shot-sunk" class to all cells of a sunk ship', () => {
      fixture.componentRef.setInput('shots', [
        { x: 0, y: 0, result: 'sunk', ship_id: 1 },
        { x: 1, y: 0, result: 'sunk', ship_id: 1 },
      ]);
      fixture.detectChanges();
      const classList = component.cellClassList();
      expect(classList['00']).toContain('shot-sunk');
      expect(classList['10']).toContain('shot-sunk');
    });
  });

  describe('onClick()', () => {
    it('should not emit cellClick when isInteractive is false', () => {
      const emitted: any[] = [];
      fixture.componentRef.setInput('isInteractive', false);
      component.cellClick.subscribe((v: any) => emitted.push(v));
      component.onClick(3, 5);
      expect(emitted).toHaveLength(0);
    });

    it('should emit cellClick when isInteractive is true and cell not already shot', () => {
      const emitted: any[] = [];
      fixture.componentRef.setInput('isInteractive', true);
      fixture.componentRef.setInput('shots', []);
      component.cellClick.subscribe((v: any) => emitted.push(v));
      component.onClick(3, 5);
      expect(emitted).toHaveLength(1);
      expect(emitted[0]).toEqual({ x: 3, y: 5 });
    });

    it('should not emit cellClick when cell was already shot', () => {
      const emitted: any[] = [];
      fixture.componentRef.setInput('isInteractive', true);
      fixture.componentRef.setInput('shots', [{ x: 3, y: 5, result: 'hit', ship_id: 1 }]);
      component.cellClick.subscribe((v: any) => emitted.push(v));
      component.onClick(3, 5);
      expect(emitted).toHaveLength(0);
    });
  });

  describe('template rendering', () => {
    it('should render a board container', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.board-container')).toBeTruthy();
    });

    it('should render 10 rows', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelectorAll('.row')).toHaveLength(10);
    });

    it('should render 100 cells total', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelectorAll('.cell')).toHaveLength(100);
    });
  });
});
