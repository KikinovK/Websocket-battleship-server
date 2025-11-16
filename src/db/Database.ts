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

export class Database {
  private players = new Map<string, Player>();
  private rooms = new Map<string, Room>();

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

  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  removeRoom(id: string): void {
    this.rooms.delete(id);
  }
}
