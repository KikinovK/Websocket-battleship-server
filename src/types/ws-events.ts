interface BaseEvent {
  type: string;
  id: 0;
}

export type Status = 'miss' | 'killed' | 'shot';

export interface Ships {
  position: { x: number; y: number };
  direction: boolean;
  length: number;
  type: 'small' | 'medium' | 'large' | 'huge';
}

// Client Events
export interface RegClientEvent extends BaseEvent {
  type: 'reg';
  data: {
    name: string;
    password: string;
  };
}

export interface CreateRoomEvent extends BaseEvent {
  type: 'create_room';
  data: '';
}

export interface AddUserToRoomEvent extends BaseEvent {
  type: 'add_user_to_room';
  data: {
    indexRoom: number | string;
  };
}

export interface AddShipsEvent extends BaseEvent {
  type: 'add_ships';
  data: {
    gameId: number | string;
    ships: Ships[];
    indexPlayer: number | string;
  };
}

export interface AttackEvent extends BaseEvent {
  type: 'attack';
  data: {
    gameId: number | string;
    x: number;
    y: number;
    indexPlayer: number | string;
  };
}

export interface RandomAttackEvent extends BaseEvent {
  type: 'randomAttack';
  data: {
    gameId: number | string;
    indexPlayer: number | string;
  };
}

export type ClientEvent =
  | RegClientEvent
  | CreateRoomEvent
  | AddUserToRoomEvent
  | AddShipsEvent
  | AttackEvent
  | RandomAttackEvent;

// Server Events
export interface RegServerEvent extends BaseEvent {
  type: 'reg';
  data: {
    name: string;
    index: number | string;
    error: boolean;
    errorText: string;
  };
}

export interface UpdateWinnersEvent extends BaseEvent {
  type: 'update_winners';
  data: {
    name: string;
    wins: number;
  }[];
}

export interface CreateGameEvent extends BaseEvent {
  type: 'create_game';
  data: {
    idGame: number | string;
    idPlayer: number | string;
  };
}

export interface UpdateRoomEvent extends BaseEvent {
  type: 'update_room';
  data: {
    roomId: number | string;
    roomUsers: {
      name: string;
      index: number | string;
    }[];
  }[];
}

export interface StartGameEvent extends BaseEvent {
  type: 'start_game';
  data: {
    ships: Ships[];
    currentPlayerIndex: number | string;
  };
}

export interface AttackServerEvent extends BaseEvent {
  type: 'attack';
  data: {
    position: { x: number; y: number };
    currentPlayer: number | string;
    status: Status;
  };
}

export interface TurnEvent extends BaseEvent {
  type: 'turn';
  data: {
    currentPlayer: number | string;
  };
}

export interface FinishEvent extends BaseEvent {
  type: 'finish';
  data: {
    winPlayer: number | string;
  };
}

export type ServerEvent =
  | RegServerEvent
  | UpdateWinnersEvent
  | CreateGameEvent
  | UpdateRoomEvent
  | StartGameEvent
  | AttackServerEvent
  | TurnEvent
  | FinishEvent;
