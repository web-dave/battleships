import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private apiUrl = 'https://battleshipsapi.webdave.de';

  constructor(private http: HttpClient) {}

  initGame(playerId?: string): Observable<any> {
    const url = playerId 
      ? `${this.apiUrl}/init_game.php?player_id=${playerId}` 
      : `${this.apiUrl}/init_game.php`;
    return this.http.get(url);
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
