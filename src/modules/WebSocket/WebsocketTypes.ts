import WebSocket from "ws";
import WebSocketOpCodeClient from "./WebSocketOpCodeClient";
import WebSocketOpCodeServer from "./WebSocketOpCodeServer";
import UserEntity from "../Users/UserEntity";
import {Teams} from "../../utils/Types";

export enum WebSocketState {
  DISCONNECTED = "DISCONNECTED",
  CONNECTED = "CONNECTED",
  NOT_AUTHORIZED = "NOT_AUTHORIZED",
  OTHER = "OTHER"
}

export enum WebSocketRole {
  ANONYMOUS = "ANONYMOUS",
  CLIENT = "CLIENT",
  REST_SERVICE = "REST_SERVICE"
}

export interface WebsocketPacket<DataType> {
  serviceCommunicationToken?: string;
  success: boolean;
  data: DataType;
}

export interface WebSocketClientSecuredMessage<DataType> {
  opCode: WebSocketOpCodeServer;
  requestId: string | null;
  token: string;
  packet: WebsocketPacket<DataType>;
  hasFinalResponse: boolean;
}

export interface WebSocketServerSecuredMessage<DataType> {
  opCode: WebSocketOpCodeClient;
  requestId: string | null;
  token: string;
  packet: WebsocketPacket<DataType>;
  hasFinalResponse: boolean;
}

export interface WebsocketClient extends WebSocket {
  id: string;
  initialToken?: string;
  role: WebSocketRole;
  wsKey?: string;
  user: UserEntity;
  state: WebSocketState;
}

export enum WebSocketCodeError {
  GAME_NOT_EXIST = 'GAME_NOT_EXIST',
  USER_ALREADY_IN_TEAM = 'USER_ALREADY_IN_TEAM'
}

// Packets
export interface WsPacketServiceResponse {
  requestId: string;
}

export interface WsPacketConnection {
  serviceToken: string | null;
  userToken: string;
  expirationDate: Date;
}

export interface WsPacketJoinTeamRequest {
  gameToken: string;
  teamId: Teams;
  position: number;
}

export interface WsPacketAddMessageRequest {
  msg: string,
  gameToken: string
}
