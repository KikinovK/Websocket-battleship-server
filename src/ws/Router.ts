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
} from '../types/ws-events.js';
import { ConnectionManager } from './ConnectionManager.js';
import { WSClient } from '../types/WSClient.js';
import { Database, Player, Room } from 'db/Database.js';
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
  }

  private handleAddShips(client: WSClient, event: AddShipsEvent) {
    // Handle add ships
  }

  private handleAttack(client: WSClient, event: AttackEvent) {
    // Handle attack
  }

  private handleRandomAttack(client: WSClient, event: RandomAttackEvent) {
    // Handle random attack
  }
}
