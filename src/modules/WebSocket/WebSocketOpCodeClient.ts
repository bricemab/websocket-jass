enum WebSocketOpCodeClient {
  WSS_TO_ANY__JOIN_GAME__RESPONSE = "WSS_TO_ANY__JOIN_GAME__RESPONSE",
  WSS_TO_ANY__JOIN_TEAM__RESPONSE = "WSS_TO_ANY__JOIN_TEAM__RESPONSE",
  WSS_TO_ANY__JOIN_GAME_UPDATE__RESPONSE = "WSS_TO_ANY__JOIN_GAME_UPDATE__RESPONSE",
  WSS_TO_ANY__GAME_START__REQUEST = "WSS_TO_ANY__GAME_START__REQUEST",
  WSS_TO_ANY__DISTRIBUTE_DECK__RESPONSE = "WSS_TO_ANY__DISTRIBUTE_DECK__RESPONSE",

  WSS_TO_ANY__TEAM_NEW_MESSAGE__RESPONSE = "WSS_TO_ANY__TEAM_NEW_MESSAGE__RESPONSE",
  WSS_TO_ANY__ALL_NEW_MESSAGE__RESPONSE = "WSS_TO_ANY__ALL_NEW_MESSAGE__RESPONSE",

  WSS_TO_ANY__PING__REQUEST = "WSS_TO_ANY__PING__REQUEST",
  WSS_TO_ANY__WS_DISCONNECTION__REQUEST = "WSS_TO_ANY__WS_DISCONNECTION__REQUEST",
  WSS_TO_ANY__WS_CONNECTION__RESPONSE = "WSS_TO_ANY__WS_CONNECTION__RESPONSE",
  WSS_TO_ANY__INVALID_OP_CODE__RESPONSE = "WSS_TO_ANY__INVALID_OP_CODE__RESPONSE",
  WSS_TO_ANY__INVALID_QUERY__RESPONSE = "WSS_TO_ANY__INVALID_QUERY__RESPONSE",
  WSS_TO_ANY__INVALID_TOKEN__RESPONSE = "WSS_TO_ANY__INVALID_TOKEN__RESPONSE",
}

export default WebSocketOpCodeClient;
