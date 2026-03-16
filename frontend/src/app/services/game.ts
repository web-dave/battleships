import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private apiUrl = 'https://battleshipsapi.webdave.de';

  constructor(private http: HttpClient) {}

  initGame(playerId?: string, playerName?: string): Observable<any> {
    const body: any = {};
    if (playerId) body['player_id'] = playerId;
    if (playerName) body['player_name'] = playerName;
    return this.http.post(`${this.apiUrl}/init_game.php`, body);
  }

  placeShips(gameId: number, playerId: string, ships: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/place_ships.php`, {
      game_id: gameId,
      player_id: playerId,
      ships
    });
  }

  fire(gameId: number, playerId: string, x: number, y: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/fire.php`, {
      game_id: gameId,
      player_id: playerId,
      x, 
      y
    });
  }

  getStatus(gameId: number, playerId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/game_status.php?game_id=${gameId}&player_id=${playerId}`);
  }

  subscribeToEvents(gameId: number, playerId: string): Observable<any> {
    return new Observable((observer) => {
      const url = `${this.apiUrl}/events.php?game_id=${gameId}&player_id=${playerId}`;
      const eventSource = new EventSource(url);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          observer.next(data);
        } catch {
          console.warn('[SSE] Failed to parse message:', event.data);
        }
      };

      eventSource.onerror = () => {
        // EventSource reconnects automatically; don't complete the observable
        console.warn('[SSE] Connection error, EventSource will reconnect automatically.');
      };

      return () => eventSource.close();
    });
  }
}

export const classMap = {
    
    "0":{
        "0": "cell",
        "1": "cell",
        "2": "cell",
        "3": "cell",
        "4": "cell",
        "5": "cell",
        "6": "cell",
        "7": "cell",
        "8": "cell",
        "9": "cell"
    },
    "1":{
        "0": "cell",
        "1": "cell",
        "2": "cell",
        "3": "cell",
        "4": "cell",
        "5": "cell",
        "6": "cell",
        "7": "cell",
        "8": "cell",
        "9": "cell"
    },
    "2":{
        "0": "cell",
        "1": "cell",
        "2": "cell",
        "3": "cell",
        "4": "cell",
        "5": "cell",
        "6": "cell",
        "7": "cell",
        "8": "cell",
        "9": "cell"
    },
    "3":{
        "0": "cell",
        "1": "cell",
        "2": "cell",
        "3": "cell",
        "4": "cell",
        "5": "cell",
        "6": "cell",
        "7": "cell",
        "8": "cell",
        "9": "cell"
    },
    "4":{
        "0": "cell",
        "1": "cell",
        "2": "cell",
        "3": "cell",
        "4": "cell",
        "5": "cell",
        "6": "cell",
        "7": "cell",
        "8": "cell",
        "9": "cell"
    },
    "5":{
        "0": "cell",
        "1": "cell",
        "2": "cell",
        "3": "cell",
        "4": "cell",
        "5": "cell",
        "6": "cell",
        "7": "cell",
        "8": "cell",
        "9": "cell"
    },
    "6":{
        "0": "cell",
        "1": "cell",
        "2": "cell",
        "3": "cell",
        "4": "cell",
        "5": "cell",
        "6": "cell",
        "7": "cell",
        "8": "cell",
        "9": "cell"
    },
    "7":{
        "0": "cell",
        "1": "cell",
        "2": "cell",
        "3": "cell",
        "4": "cell",
        "5": "cell",
        "6": "cell",
        "7": "cell",
        "8": "cell",
        "9": "cell"
    },
    "8":{
        "0": "cell",
        "1": "cell",
        "2": "cell",
        "3": "cell",
        "4": "cell",
        "5": "cell",
        "6": "cell",
        "7": "cell",
        "8": "cell",
        "9": "cell"
    },
    "9":{
        "0": "cell",
        "1": "cell",
        "2": "cell",
        "3": "cell",
        "4": "cell",
        "5": "cell",
        "6": "cell",
        "7": "cell",
        "8": "cell",
        "9": "cell"
    }

  }
