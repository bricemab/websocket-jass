export enum WebSocketRole {
  ANONYMOUS = "ANONYMOUS",
  CLIENT = "CLIENT",
  REST_SERVICE = "REST_SERVICE"
}

export interface Service {
  name: string;
  token: string;
}
