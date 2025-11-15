interface Player {
  id: string;
  name: string;
  password: string;
  wins: number;
}

export class Database {
  private players = new Map<string, Player>();

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
}
