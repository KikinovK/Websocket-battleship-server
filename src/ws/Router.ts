import { randomUUID } from 'crypto';

import {
  ClientEvent,
  RegClientEvent,
  AddUserToRoomEvent,
  AddShipsEvent,
  AttackEvent,
  RandomAttackEvent,
  RegServerEvent,
  ServerEvent,
  UpdateRoomEvent,
  CreateGameEvent,
  StartGameEvent,
  TurnEvent,
  AttackServerEvent,
  Status,
  Ships,
} from '../types/ws-events.js';
import { ConnectionManager } from './ConnectionManager.js';
import { WSClient } from '../types/WSClient.js';
import { Database, Game, Player } from 'db/Database.js';
import { colorize } from 'utils/colors.js';

export class Router {
  constructor(
    private connections: ConnectionManager,
    private db: Database
  ) {}

  private sendResponse(client: WSClient, event: ServerEvent) {
    const response = {
      ...event,
      data: JSON.stringify(event.data),
    };
    client.socket.send(JSON.stringify(response));
  }

  private sendPlayerReg(client: WSClient, player: Player, error: boolean = false, errorText: string = '') {
    const response: RegServerEvent = {
      type: 'reg',
      data: {
        name: player.name,
        index: player.id,
        error,
        errorText,
      },
      id: 0,
    };
    this.sendResponse(client, response);
  }

  private sendRoomUpdate(client: WSClient) {
    const joinResponse: UpdateRoomEvent = {
      type: 'update_room',
      data: this.db.getAllRooms().map((room) => {
        if (room.playerIds.length === 0) {
          return { roomId: room.id, roomUsers: [] };
        }
        return {
          roomId: room.id,
          roomUsers: room.playerIds.map((playerId) => {
            const player = this.db.getPlayer(playerId);
            return {
              name: player?.name || 'Unknown',
              index: playerId,
            };
          }),
        };
      }),
      id: 0,
    };
    this.sendResponse(client, joinResponse);
  }

  private sendCreateGame(client: WSClient, gameId: string, playerId: string) {
    const response: CreateGameEvent = {
      type: 'create_game',
      data: {
        idGame: gameId,
        idPlayer: playerId,
      },
      id: 0,
    };
    this.sendResponse(client, response);
  }

  private sendStartGame(client: WSClient, game: Game) {
    const response: StartGameEvent = {
      type: 'start_game',
      data: {
        ships: game.ships.get(client.playerId!) || [],
        currentPlayerIndex: client.playerId!,
      },
      id: 0,
    };
    this.sendResponse(client, response);
  }

  private sendTurn(client: WSClient, game: Game) {
    const response: TurnEvent = {
      type: 'turn',
      data: {
        currentPlayer: game.currentPlayer,
      },
      id: 0,
    };
    this.sendResponse(client, response);
  }

  sendAttackFeedback(client: WSClient, position: { x: number; y: number }, status: Status) {
    const currentPlayer = client.playerId || '';
    const response: AttackServerEvent = {
      type: 'attack',
      data: {
        currentPlayer,
        position,
        status,
      },
      id: 0,
    };
    this.sendResponse(client, response);
  }

  private findHitShip(ship: Ships, x: number, y: number) {
    const { position, direction, length } = ship;
    if (direction) {
      return position.x === x && y >= position.y && y < position.y + length;
    } else {
      return position.y === y && x >= position.x && x < position.x + length;
    }
  }

  private processAttack(client: WSClient, gameId: string, indexPlayer: string, attackX: number, attackY: number) {
    const game = this.db.getGame(gameId);
    const opponentId = game?.playerIds.find((id) => id !== indexPlayer);
    const ships = game?.ships.get(opponentId!) || [];
    let status: Status = 'miss';
    let hitShip = false;

    ships.forEach((ship, index) => {
      hitShip = this.findHitShip(ship, attackX, attackY);
      if (hitShip) {
        this.db.addHitToShip(gameId, opponentId!, index, { x: attackX, y: attackY });
        status = ship.hit!.length === ship.length ? 'killed' : 'shot';
      }
    });

    console.log(colorize(`Hit the x:${attackX},y:${attackY} of the ${status}`, 'green'));
    this.sendAttackFeedback(client, { x: attackX, y: attackY }, status);
    this.db.changeCurentPlayer(gameId, opponentId!);
    this.db.getGame(gameId)!.playerIds.forEach((playerId) => {
      const playerClient = this.connections.getClientByPlayerId(playerId);
      if (playerClient) {
        this.sendTurn(playerClient, this.db.getGame(gameId)!);
      }
    });
  }

  handle(client: WSClient, event: ClientEvent) {
    switch (event.type) {
      case 'reg':
        this.handleReg(client, event);
        break;
      case 'create_room':
        this.handleCreateRoom(client);
        break;
      case 'add_user_to_room':
        this.handleAddUserToRoom(client, event);
        break;
      case 'add_ships':
        this.handleAddShips(client, event);
        break;
      case 'attack':
        this.handleAttack(client, event);
        break;
      case 'randomAttack':
        this.handleRandomAttack(client, event);
        break;
      default:
        client.socket.send(JSON.stringify({ error: 'Unknown event type' }));
    }
  }

  private handleReg(client: WSClient, event: RegClientEvent) {
    const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

    let player = this.db.getPlayerByName(data.name);

    if (!player) {
      player = this.db.addPlayer(randomUUID(), data.name, data.password);
      console.log(colorize(`Registered new player: ${colorize(player.name, 'yellow')}`, 'cyan'));
    }

    if (player.password !== data.password) {
      console.log(colorize(`Wrong password for player: ${colorize(player.name, 'yellow')}`, 'red'));
      this.sendPlayerReg(client, player, true, 'Wrong password');
      return;
    }

    client.playerId = player.id;
    console.log(colorize(`Player logged in: ${colorize(player.name, 'yellow')}`, 'cyan'));
    this.sendPlayerReg(client, player);
    this.sendRoomUpdate(client);
  }

  private handleCreateRoom(client: WSClient) {
    const room = this.db.createRoom(randomUUID());
    console.log(colorize(`Room ${colorize(room.id, 'yellow')} created`, 'cyan'));
    this.sendRoomUpdate(client);
  }

  private handleAddUserToRoom(client: WSClient, event: AddUserToRoomEvent) {
    const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

    if (this.db.getRoom(data.indexRoom)?.playerIds.includes(client.playerId!)) {
      console.log(
        colorize(
          `Player ${colorize(this.db.getPlayer(client.playerId!)?.name || 'Unknown', 'yellow')} is already in room ${colorize(data.indexRoom, 'yellow')}`,
          'red'
        )
      );
      return;
    }

    const room = this.db.addPlayerToRoom(data.indexRoom, client.playerId!);
    if (!room) {
      console.log(colorize(`Failed to add player to room ${colorize(data.indexRoom, 'yellow')}`, 'red'));
      return;
    }

    const player = this.db.getPlayer(client.playerId!);
    console.log(
      colorize(
        `Player ${colorize(player?.name || 'Unknown', 'yellow')} added to room ${colorize(room.id, 'yellow')}`,
        'cyan'
      )
    );
    this.sendRoomUpdate(client);

    if (room.playerIds.length === 2) {
      const gameId = randomUUID();
      room.gameId = gameId;
      room.playerIds.forEach((playerId) => {
        const playerClient = this.connections.getClientByPlayerId(playerId);
        if (playerClient) {
          this.sendCreateGame(playerClient, gameId, playerId);
        }
      });
      this.db.createGame(gameId, room.playerIds);

      console.log(
        colorize(`Game ${colorize(gameId, 'yellow')} created for room ${colorize(room.id, 'yellow')}`, 'cyan')
      );
    }
  }

  private handleAddShips(client: WSClient, event: AddShipsEvent) {
    const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
    const gameId = data.gameId;
    this.db.addShipsToGame(gameId, client.playerId!, data.ships);

    console.log(
      colorize(
        `Player ${colorize(this.db.getPlayer(client.playerId!)?.name || 'Unknown', 'yellow')} added ships`,
        'cyan'
      )
    );

    const game = this.db.getGame(gameId);

    if (game?.ships.size === 2) {
      console.log(colorize(`Game ${colorize(gameId, 'yellow')} ready to start`, 'cyan'));
      game.playerIds.forEach((playerId) => {
        const playerClient = this.connections.getClientByPlayerId(playerId);
        if (playerClient) {
          this.sendStartGame(playerClient, game);
          this.sendTurn(playerClient, game);
        }
      });
    }
  }

  private handleAttack(client: WSClient, event: AttackEvent) {
    const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
    this.processAttack(client, data.gameId, data.indexPlayer, data.x, data.y);
  }

  private handleRandomAttack(client: WSClient, event: RandomAttackEvent) {
    const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
    const attackX = Math.floor(Math.random() * 10);
    const attackY = Math.floor(Math.random() * 10);
    this.processAttack(client, data.gameId, data.indexPlayer, attackX, attackY);
  }
}
