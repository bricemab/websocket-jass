import { Request } from "express";
import {
  AuthenticationErrors,
  GeneralErrors
} from "../Global/BackendErrors";
import { UserRole } from "../permissions/UserRoles";
import {Moment} from "moment/moment";
import {TrumpsType} from "../Global/CardsType";

export interface ApplicationError {
  code: GeneralErrors | AuthenticationErrors;
  message: string;
  details?: any;
}

export interface ApplicationSession {
  email: string;
  extra: SessionExtraData;
}
export interface SessionExtraData {
  role: UserRole;
  service: {
    code: string;
    label: string;
  };
}
export interface ApplicationRequestSessionToken extends ApplicationSession {
  iat: number;
  exp: number;
}

export type ApplicationReject = (error: ApplicationError) => void;

export interface ApplicationRequest<BodyData> extends Request {
  rawToken: string;
  hasValidToken: boolean;
  tokenDecryptedData?: ApplicationSession;
  body: BodyData;
  headers: {
    "x-access-token": string;
    "x-user-token"?: string;
  };
}

export interface ApplicationResponse<DataType> {
  success: boolean;
  data?: DataType;
  error?: ApplicationError;
}

export type ApplicationResponsePromise<DataType> = Promise<
  ApplicationResponse<DataType>
  >;

export enum WebSocketRole {
  ANONYMOUS = "ANONYMOUS",
  CLIENT = "CLIENT",
  REST_SERVICE = "REST_SERVICE"
}

export interface DatabaseSettings {
  key: string;
  value: string;
  description: string
}

export interface DatabaseUser{
  id: number;
  pseudo: string;
  email: string;
  password: string;
  registration_date: Date;
  last_connexion_date: Date;
  ws_token: string;
  is_archived: boolean
}

export interface Service {
  name: string;
  token: string;
}

export enum WebSocketState {
  DISCONNECTED = "DISCONNECTED",
  CONNECTED = "CONNECTED",
  OTHER = "OTHER"
}

export interface WebsocketClient extends WebSocket {
  id: string;
  token: string;
  role: WebSocketRole;
  service: Service;
  state: WebSocketState;
  hasFinalResponse: boolean;
}

export enum Teams {
  TEAM_BLUE= 'TEAM_BLUE',
  TEAM_RED= 'TEAM_RED'
}

export interface DataBaseGame {
  id: number;
  token: string;
  joining_key: string;
  start_date: Date;
  end_date: Date;
  winner_team: Teams;
  is_finished: number;
  is_full: number;
}
export interface DataBaseGameUser {
  id: number;
  team_id: Teams;
  user_id: number;
  joining_game_date: Date;
  game_id: number;
  position: number;
  is_finished: number;
}

export interface DataBaseGameMessage {
  id: number;
  text: string;
  user_id: number;
  game_id: number;
  date: Date;
  is_all: boolean;
}

export interface DataBaseGameRound {
  id: number;
  game_id: number;
  round: number;
  trump_user_id: number;
  trump_second_user_id: number;
  trump: TrumpsType;
  is_finished: number;
}

export interface DataBaseDeckCards {
  id: number;
  user_id: number;
  card: string;
  game_round_id: number;
  game_id: number;
  is_played: number;
}

export interface DataBaseGameTurnLogs {
  id: number;
  game_round_id: number;
  user_id: number;
  card: string;
  date: Date;
}
