import { Ships } from 'types/ws-events.js';

export interface ShipsState extends Ships {
  hit: { x: number; y: number }[];
}

export interface Player {
  id: string;
  name: string;
  password: string;
  wins: number;
}

export interface Room {
  id: string;
  playerIds: string[];
  gameId?: string;
}

export interface Game {
  id: string;
  playerIds: string[];
  ships: Map<string, ShipsState[]>;
  currentPlayer: string;
  status: 'waiting' | 'active' | 'finished';
}

export class Database {
  private players = new Map<string, Player>();
  private rooms = new Map<string, Room>();
  private games = new Map<string, Game>();

  // Players
  addPlayer(id: string, name: string, password: string): Player {
    const player: Player = { id, name, password, wins: 0 };
    this.players.set(id, player);
    return player;
  }

  getPlayer(id: string): Player | undefined {
    return this.players.get(id);
  }

  getPlayerByName(name: string): Player | undefined {
    return Array.from(this.players.values()).find((p) => p.name === name);
  }

  // Rooms
  createRoom(id: string): Room {
    const room: Room = { id, playerIds: [] };
    this.rooms.set(id, room);
    return room;
  }

  addPlayerToRoom(roomId: string, playerId: string): Room | undefined {
    const room = this.rooms.get(roomId);
    if (room && room.playerIds.length < 2) {
      room.playerIds.push(playerId);
      return room;
    }
    return undefined;
  }

  getRoom(id: string): Room | undefined {
    return this.rooms.get(id);
  }

  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  removeRoom(id: string): void {
    this.rooms.delete(id);
  }

  // Games
  createGame(id: string, playerIds: string[]): Game {
    const game: Game = {
      id,
      playerIds,
      ships: new Map(),
      currentPlayer: playerIds[0] || '',
      status: 'waiting',
    };
    this.games.set(id, game);
    return game;
  }

  changeCurentPlayer(gameId: string, playerId: string): void {
    const game = this.games.get(gameId);
    if (game) {
      game.currentPlayer = playerId;
    }
  }

  getGame(id: string): Game | undefined {
    return this.games.get(id);
  }

  addShipsToGame(gameId: string, playerId: string, ships: Ships[]): void {
    const shipWhihtHit: ShipsState[] = ships.map((ship) => ({ ...ship, hit: [] }));
    const game = this.games.get(gameId);
    if (game) {
      game.ships.set(playerId, shipWhihtHit);
    }
  }

  addHitToShip(gameId: string, playerId: string, shipPosition: number, hit: { x: number; y: number }): void {
    const game = this.games.get(gameId);
    if (game) {
      const ship = game.ships.get(playerId)?.[shipPosition];
      if (ship?.hit && !ship.hit.some((h) => h.x === hit.x && h.y === hit.y)) {
        ship.hit.push(hit);
      }
    }
  }

  removeGame(id: string): void {
    this.games.delete(id);
  }
}
