import {
  ClientEvent,
  RegClientEvent,
  CreateRoomEvent,
  AddUserToRoomEvent,
  AddShipsEvent,
  AttackEvent,
  RandomAttackEvent,
} from '../types/ws-events.js';
import { ConnectionManager } from './ConnectionManager.js';
import { WSClient } from '../types/WSClient.js';

export class Router {
  constructor(private connections: ConnectionManager) {}

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
    }
  }

  private handleReg(client: WSClient, event: RegClientEvent) {
    const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
    client.socket.send(
      JSON.stringify({
        type: 'reg',
        data: JSON.stringify({
          name: data.name,
          index: client.id,
          error: false,
          errorText: '',
        }),
        id: 0,
      })
    );
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
