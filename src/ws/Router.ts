import { randomUUID } from 'crypto';

import {
  ClientEvent,
  RegClientEvent,
  CreateRoomEvent,
  AddUserToRoomEvent,
  AddShipsEvent,
  AttackEvent,
  RandomAttackEvent,
  RegServerEvent,
  ServerEvent,
} from '../types/ws-events.js';
import { ConnectionManager } from './ConnectionManager.js';
import { WSClient } from '../types/WSClient.js';
import { Database } from 'db/Database.js';
import { colorize } from 'utils/colors.js';

export class Router {
  constructor(
    private connections: ConnectionManager,
    private db: Database
  ) {}

  private sendResponse(client: WSClient, event: ServerEvent) {
    client.socket.send(JSON.stringify(event));
  }

  handle(client: WSClient, event: ClientEvent) {
    switch (event.type) {
      case 'reg':
        this.handleReg(client, event);
        break;
      case 'create_room':
        this.handleCreateRoom(client, event);
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
      console.log(colorize(`Registered new player: ${colorize(data.name, 'yellow')}`, 'cyan'));
    }

    if (player.password !== data.password) {
      console.log(colorize(`Wrong password for player: ${colorize(data.name, 'yellow')}`, 'red'));
      const errorResponse: RegServerEvent = {
        type: 'reg',
        data: {
          name: data.name,
          index: client.id,
          error: true,
          errorText: 'Wrong password',
        },
        id: 0,
      };
      this.sendResponse(client, errorResponse);
      return;
    }

    client.playerId = player.id;
    console.log(colorize(`Player logged in: ${colorize(data.name, 'yellow')}`, 'cyan'));
    const successResponse: RegServerEvent = {
      type: 'reg',
      data: {
        name: data.name,
        index: client.id,
        error: false,
        errorText: '',
      },
      id: 0,
    };
    this.sendResponse(client, successResponse);
  }

  private handleCreateRoom(client: WSClient, event: CreateRoomEvent) {
    // Handle create room
  }

  private handleAddUserToRoom(client: WSClient, event: AddUserToRoomEvent) {
    // Handle add user to room
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
