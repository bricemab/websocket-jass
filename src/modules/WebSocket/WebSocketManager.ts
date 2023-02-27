import WebSocket from "ws";
import {
  WebsocketClient,
  WebSocketClientSecuredMessage,
  WebSocketCodeError,
  WebsocketPacket,
  WebSocketRole,
  WebSocketState,
  WsPacketAddMessageRequest,
  WsPacketConnection,
  WsPacketJoinTeamRequest,
  WsPacketServiceResponse
} from "./WebsocketTypes";
import WebSocketOpCodeServer from "./WebSocketOpCodeServer";
import WebSocketOpCodeClient from "./WebSocketOpCodeClient";
import Utils from "../../utils/Utils";
import config from "../../config/config";
import SettingsManager from "../Settings/SettingsManager";
import UsersManager from "../Users/UsersManager";
import GamesManager from "../Games/GamesManager";
import GameEntity from "../Games/GameEntity";
import moment from "moment";
import GameUsersManager, {AvailableTeamPlace} from "../GameUsers/GameUsersManager";
import GameUserEntity from "../GameUsers/GameUserEntity";
import GameMessageEntity from "../GameMessages/GameMessageEntity";
import {ApplicationResponsePromise, Teams} from "../../utils/Types";
import GameMessagesManager from "../GameMessages/GameMessagesManager";
import GameRoundsManager from "../GameRounds/GameRoundsManager";
import GameRoundEntity from "../GameRounds/GameRoundEntity";
import DeckCardsManager from "../DeckCards/DeckCardsManager";

export default class WebSocketManager {
  constructor(wss: WebSocket.Server) {
    this.wss = wss;
    this.state = WebSocketState.DISCONNECTED;
    this.waitingRequests = {};
    const self = this;
    this.intervalInstance = setInterval(function ping() {
      self.wss.clients.forEach((ws: any) => {
        if (ws.state !== WebSocketState.CONNECTED) {
          return ws.terminate();
        }
        ws.state = WebSocketState.DISCONNECTED;
        const serviceKey = ws.role === WebSocketRole.REST_SERVICE ? ws.wsKey : ws.role;
        console.log(`Sending ping to ${serviceKey}`);
        if (ws.role === WebSocketRole.CLIENT) {
          ws.send(JSON.stringify({
            requestId: Utils.uniqueId(24),
            opCode: WebSocketOpCodeClient.WSS_TO_ANY__PING__REQUEST,
            packet: {},
            token: Utils.buildHmacSha256Signature({}),
            hasFinalResponse: true
          }))
          ws.state = WebSocketState.CONNECTED;
        } else {
          ws.ping(JSON.stringify({}));
        }
      });
    }, 10000);
  }

  wss: WebSocket.Server;
  state: WebSocketState;
  intervalInstance: any;
  waitingRequests: { [key: string]: WebsocketClient };

  static generateId() {
    return `_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }

  onNewConnection = (clientWs: WebsocketClient) => {
    this.state = WebSocketState.CONNECTED;
    clientWs.id = WebSocketManager.generateId();
    clientWs.role = WebSocketRole.ANONYMOUS;
    clientWs.state = WebSocketState.DISCONNECTED;

    clientWs.on("message", (message: string) =>
      WebSocketManager.onMessageReceived(JSON.parse(message), clientWs, this)
    );

    clientWs.on("error", (message: any) =>
      WebSocketManager.onError(message, clientWs, this)
    );

    clientWs.on("close", (message: any) =>
      WebSocketManager.onClose(message, clientWs, this)
    );

    clientWs.on("pong", (message: any) =>
      WebSocketManager.onPong(message, clientWs, this)
    );
  };

  static sendMessageToApiClient<DataType>(
    manager: WebSocketManager,
    requestId: string,
    messageType: WebSocketOpCodeClient,
    data: WebsocketPacket<DataType>,
    hasFinalResponse: boolean
  ) {
    let restService: null | WebsocketClient = null;
    manager.wss.clients.forEach(value => {
      const ws = value as WebsocketClient;
      if (
        ws.state === WebSocketState.CONNECTED &&
        ws.wsKey === config.server.restKey
      ) {
        restService = ws;
      }
    });

    if (restService) {
      console.log(data);
      WebSocketManager.sendMessageToClient(
        manager,
        restService,
        requestId,
        messageType,
        data,
        hasFinalResponse
      );
    } else {
      console.log(
        "The message could not been sent, because any rest service was found"
      );
      console.log(messageType, data);
    }
  }

  static respondToWaitingWebsocket<DataType>(
    manager: WebSocketManager,
    requestId: string,
    messageType: WebSocketOpCodeClient,
    data: WebsocketPacket<DataType>,
    hasFinalResponse: boolean
  ) {
    const clientWebsocket: undefined | WebsocketClient =
      manager.waitingRequests[requestId];
    if (clientWebsocket) {
      WebSocketManager.sendMessageToClient(
        manager,
        clientWebsocket,
        requestId,
        messageType,
        data,
        hasFinalResponse
      );
    } else {
      console.log(
        `The message could not been sent, because any client websocket was found for the request with id ${requestId}`
      );
      console.log(
        messageType,
        data,
        requestId,
        Object.keys(manager.waitingRequests)
      );
    }
  }

  static async getClientsWsByGame(
    manager: WebSocketManager,
    gameToken: string
  ): ApplicationResponsePromise<{clientsWs: WebsocketClient[]}> {
    const gameUsersResponse = await GameUsersManager.findUsersByGameToken(gameToken);
    const clientsWs: WebsocketClient[] = [];
    if (gameUsersResponse.success && gameUsersResponse.data) {
      const { gameUsers } = gameUsersResponse.data;
      for (const userGame of gameUsers) {
        manager.wss.clients.forEach(value => {
          const ws = value as WebsocketClient;
          if (ws.role === WebSocketRole.CLIENT && ws.user.id === userGame.userId) {
            clientsWs.push(ws);
          }
        });
      }
    }
    return {
      success: true,
      data: {
        clientsWs
      }
    };
  }

  static async sendMessageToGameUsers<DataType>(
    manager: WebSocketManager,
    gameToken: string,
    requestId: string | null,
    messageType: WebSocketOpCodeClient,
    data: WebsocketPacket<DataType>,
    hasFinalResponse: boolean
  ) {
    if (!requestId) {
      requestId = Utils.uniqueId(24);
    }

    const gameUsersResponse = await GameUsersManager.findUsersByGameToken(gameToken);
    let hasSend = false;
    if (gameUsersResponse.success && gameUsersResponse.data) {
      const { gameUsers } = gameUsersResponse.data
      for (const userGame of gameUsers) {
        manager.wss.clients.forEach(value => {
          const ws = value as WebsocketClient;
          if (ws.role === WebSocketRole.CLIENT && ws.user.id === userGame.userId) {
            hasSend = true;
            console.log(data, Utils.buildHmacSha256Signature(data));

            const finalData = {
              requestId,
              opCode: messageType,
              packet: data,
              token: Utils.buildHmacSha256Signature(data),
              hasFinalResponse
            };
            console.log("Data send to game players", finalData)
            ws.send(JSON.stringify(finalData));
          }
        })
      }
    }
    if (!hasSend) {
      console.log("Message could not be sent because WS was not ready")
    }

  }

  static async sendMessageToTeamUsers<DataType>(
    manager: WebSocketManager,
    gameToken: string,
    teamId: Teams,
    requestId: string | null,
    messageType: WebSocketOpCodeClient,
    data: WebsocketPacket<DataType>,
    hasFinalResponse: boolean
  ) {
    if (!requestId) {
      requestId = Utils.uniqueId(24);
    }

    const gameUsersResponse = await GameUsersManager.findUsersByGameToken(gameToken);
    let hasSend = false;
    if (gameUsersResponse.success && gameUsersResponse.data) {
      const { gameUsers } = gameUsersResponse.data
      for (const userGame of gameUsers) {
        manager.wss.clients.forEach(value => {
          const ws = value as WebsocketClient;
          if (
            ws.role === WebSocketRole.CLIENT &&
            ws.user.id === userGame.userId &&
            userGame.teamId === teamId
          ) {
            hasSend = true;
            console.log(data, Utils.buildHmacSha256Signature(data));

            const finalData = {
              requestId,
              opCode: messageType,
              packet: data,
              token: Utils.buildHmacSha256Signature(data),
              hasFinalResponse
            };
            console.log("Data send to game players", finalData)
            ws.send(JSON.stringify(finalData));
          }
        })
      }
    }
    if (!hasSend) {
      console.log("Message could not be sent because WS was not ready")
    }

  }

  static sendMessageToClient<DataType>(
    manager: WebSocketManager,
    clientWs: WebsocketClient,
    requestId: string | null,
    messageType: WebSocketOpCodeClient,
    data: WebsocketPacket<DataType>,
    hasFinalResponse: boolean
  ) {
    if (!requestId) {
      requestId = Utils.uniqueId(24);
    }

    if (clientWs.readyState === clientWs.OPEN) {
      const finalData = {
        requestId,
        opCode: messageType,
        packet: data,
        token: Utils.buildHmacSha256Signature(data),
        hasFinalResponse
      };

      clientWs.send(JSON.stringify(finalData));
    } else {
      console.error("Message could not be sent because WS was not ready");
      console.log({
        opCode: messageType,
        packet: data
      });
    }

    if (hasFinalResponse && manager.waitingRequests[requestId]) {
      delete manager.waitingRequests[requestId];
    }
  }

  static async onMessageReceived(
    message: WebSocketClientSecuredMessage<any>,
    clientWs: WebsocketClient,
    manager: WebSocketManager
  ) {
    console.log(`MESSAGE RECEIVED from ${clientWs.user && clientWs.user.pseudo ? clientWs.user.pseudo : clientWs.wsKey}`, message);

    if (
      typeof message !== "object" ||
      typeof message.token !== "string" ||
      typeof message.requestId !== "string" ||
      typeof message.opCode !== "string" ||
      typeof message.packet !== "object"
    ) {
      WebSocketManager.sendMessageToClient<WsPacketServiceResponse>(
        manager,
        clientWs,
        null,
        WebSocketOpCodeClient.WSS_TO_ANY__INVALID_QUERY__RESPONSE,
        {
          success: false,
          data: {
            requestId: message.requestId || "UNKNOWN"
          }
        },
        true
      );
      return;
    }

    if (
      !message.hasFinalResponse &&
      !manager.waitingRequests[message.requestId]
    ) {
      manager.waitingRequests[message.requestId] = clientWs;
    }

    if (
      !Utils.validateHmacSha256Signature(
        message.token as string,
        message.packet
      )
    ) {
      WebSocketManager.sendMessageToClient<WsPacketServiceResponse>(
        manager,
        clientWs,
        null,
        WebSocketOpCodeClient.WSS_TO_ANY__INVALID_TOKEN__RESPONSE,
        {
          success: false,
          data: {
            requestId: message.requestId || "UNKNOWN"
          }
        },
        true
      );
      return;
    }
    const { packet, opCode } = message;
    console.log(`============ ${opCode} ============`);
    let messageTyped: WebSocketClientSecuredMessage<any>;
    // @ts-ignore
    switch (opCode) {
      case WebSocketOpCodeServer.WSS_FROM_ANY__WS_CONNECTION__REQUEST:
        messageTyped = message as WebSocketClientSecuredMessage<WsPacketConnection>;
        clientWs.state = WebSocketState.CONNECTED;

        if (packet.success && packet.data.serviceToken) {
          clientWs.initialToken = packet.data.serviceToken;
          const apiServer = await SettingsManager.findByValue(packet.data.serviceToken);
          if (apiServer.success && apiServer.data) {
            clientWs.wsKey = config.server.restKey;
            clientWs.role = WebSocketRole.REST_SERVICE;
            return WebSocketManager.sendMessageToClient(
              manager,
              clientWs,
              message.requestId,
              WebSocketOpCodeClient.WSS_TO_ANY__WS_CONNECTION__RESPONSE,
              {
                success: true,
                data: {
                  state: clientWs.state,
                  initialToken: clientWs.initialToken,
                  wsKey: clientWs.wsKey ?? null,
                  role: clientWs.role,
                }
              },
              true
            );
          }
        }

        if (packet.success && packet.data.userToken) {
          clientWs.initialToken = packet.data.userToken;
          const userResponse = await UsersManager.findByWsToken(packet.data.userToken);
          if (userResponse.success && userResponse.data) {
            clientWs.wsKey = userResponse.data.user.wsToken;
            clientWs.user = userResponse.data.user;
            clientWs.role = WebSocketRole.CLIENT;
            return WebSocketManager.sendMessageToClient(
              manager,
              clientWs,
              message.requestId,
              WebSocketOpCodeClient.WSS_TO_ANY__WS_CONNECTION__RESPONSE,
              {
                success: true,
                data: {
                  state: clientWs.state,
                  initialToken: clientWs.initialToken,
                  wsKey: clientWs.wsKey ?? null,
                  role: clientWs.role,
                }
              },
              true
            );
          }

          clientWs.role = WebSocketRole.ANONYMOUS;
          clientWs.state = WebSocketState.NOT_AUTHORIZED;
          return WebSocketManager.sendMessageToClient(
            manager,
            clientWs,
            message.requestId,
            WebSocketOpCodeClient.WSS_TO_ANY__WS_CONNECTION__RESPONSE,
            {
              success: false,
              data: {
                state: clientWs.state,
                initialToken: clientWs.initialToken,
                wsKey: clientWs.wsKey ?? null,
                role: clientWs.role,
              }
            },
            true
          );
        }
        break;
      case WebSocketOpCodeServer.WSS_FROM_ANY__WS_DISCONNECTION__RESPONSE:
        // NOT USED YET
        console.log("WSS_FROM_ANY__WS_DISCONNECTION__RESPONSE");
        console.log(message);
        WebSocketManager.sendMessageToClient(
          manager,
          clientWs,
          message.requestId,
          WebSocketOpCodeClient.WSS_TO_ANY__WS_DISCONNECTION__REQUEST,
          {
            success: true,
            data: { disconnected: true }
          },
          true
        );
        break;
      case WebSocketOpCodeServer.WSS_FROM_ANY__JOIN_GAME__REQUEST:
        // verif si le clientWs.user.id est dans la table  game_users et si la partie est finie
        //s'il n'est pas => créer la partie (si aucune n'est encore disponible) et proposer de join les team encoer libre
        // => verifier dans la table game_users que pour la partie, les places sont dispo et renvoyer à l'utilisateur pour choisir
        messageTyped = message as WebSocketClientSecuredMessage<any>;

        const gameUserResponse = await GamesManager.findCurrentUserGame(clientWs.user.id);
        let currentGame = null as unknown as GameEntity;
        let currentGameUser = null as unknown as GameUserEntity;
        let availableTeamPlaces:AvailableTeamPlace[] = [];
        // deja dans une game + team
        if (gameUserResponse.success && gameUserResponse.data) {
          const { game, gameUser } = gameUserResponse.data;
          currentGame = game;
          currentGameUser = gameUser;
        } else {
          const findAvailableGame = await GamesManager.findAvailableGame();
          if (findAvailableGame.success && findAvailableGame.data) {
            currentGame = findAvailableGame.data.game;
          } else {
            const newGame = new GameEntity(
              null,
              Utils.uniqueId(40),
              Utils.uniqueId(6).toUpperCase(),
              null,
              null,
              null,
              false,
              false
            );
            await newGame.save();
            currentGame = newGame;
          }
          const tmpGameUserResponse = await GameUsersManager.findByUserId(clientWs.user!.id, "NOT_FINISHED");
          if (!tmpGameUserResponse.success && !tmpGameUserResponse.data) {
            const gameUser = new GameUserEntity(
              null,
              null,
              clientWs.user.id,
              null,
              currentGame.id!,
              null,
              false
            );
            await gameUser.save();
            currentGameUser = gameUser;
          } else {
            currentGameUser = tmpGameUserResponse.data!.gameUser;
          }
        }
        const findAvailableTeamPlace = await GameUsersManager.findAvailableTeamPlace(currentGame.id!);
        availableTeamPlaces = findAvailableTeamPlace.data!.availableTeamPlaces;

        const allMessagesResponse = await GameMessagesManager.findByGame(currentGame.id!);
        const { gameMessages } = allMessagesResponse.data!;

        const gameUsersResponse = await GameUsersManager.findUsersByGameToken(currentGame.token);
        if (!gameUsersResponse.success && !gameUsersResponse.data) {
          console.log("no gameUsers")
        }
        const { gameUsers } = gameUsersResponse.data!;
        const finalMessages: {pseudo: string; isSystem: boolean; msg: string;}[] = [];
        for (const message of gameMessages) {
          const user = gameUsers.find(u => u.userId === message.userId);
          if (user) {
            const currentUser = await UsersManager.findById(user.userId);
            finalMessages.push({
              msg: message.text,
              pseudo: currentUser.data!.user.pseudo,
              isSystem: false
            })
          }
        }

        return WebSocketManager.sendMessageToClient(
          manager,
          clientWs,
          message.requestId,
          WebSocketOpCodeClient.WSS_TO_ANY__JOIN_GAME__RESPONSE,
          {
            success: true,
            data: {
              game: currentGame.toJSON(),
              availableTeamPlaces: availableTeamPlaces,
              gameUser: currentGameUser ? currentGameUser.toJSON() : null,
              messages: finalMessages,
              isGameStarted: currentGame.isFull
            }
          },
          true
        );
      case WebSocketOpCodeServer.WSS_FROM_ANY__DISTRIBUTE_DECK__REQUEST:
        const gameDistributeDeckResponse = await GamesManager.findCurrentUserGame(clientWs.user.id);
        const {game: gameDistributeDeck} = gameDistributeDeckResponse.data!;
        const gameUsersDkResponse = await GameUsersManager.findUsersByGameToken(gameDistributeDeck.token);
        const { gameUsers: gameUsersDk } = gameUsersDkResponse.data!;
        const gameRoundDkResponse = await GameRoundsManager.findLastRoundByGame(gameDistributeDeck.id!);
        const {gameRound: gameRoundDk} = gameRoundDkResponse.data!;
        const clientsDkResponse = await WebSocketManager.getClientsWsByGame(manager, gameDistributeDeck.token);
        const { clientsWs: clientsWsDk } = clientsDkResponse.data!;
        const trumpPosition = gameUsersDk.find(u => {
          return u.userId === gameRoundDk.trumpUserId;
        }) ;
        for (const gameUser of gameUsersDk) {
          const clientWsDk = clientsWsDk.find(cl => cl.user.id === gameUser.userId);
          if ((clientWsDk && !gameDistributeDeck.isFull) || (clientWsDk && clientWs.user.id === gameUser.userId)) {
            const userDeckDkResponse = await DeckCardsManager.getByUserRound(gameUser.userId, gameRoundDk.id!, true);
            const { deckCards: deckCardsDk } = userDeckDkResponse.data!;
            WebSocketManager.sendMessageToClient(
              manager,
              clientWsDk,
              message.requestId,
              WebSocketOpCodeClient.WSS_TO_ANY__DISTRIBUTE_DECK__RESPONSE,
              {
                success: true,
                data: {
                  deckCards: deckCardsDk.map(c => {
                    return c.toJSON();
                  }),
                  trumpPosition: trumpPosition ? trumpPosition.position : null
                }
              },
              true
            );
          }
        }
        break;
      case WebSocketOpCodeServer.WSS_FROM_ANY__GAME_START__REQUEST:
        const gameUserGameStartResponse = await GamesManager.findCurrentUserGame(clientWs.user.id);
        if (!gameUserGameStartResponse.success && !gameUserGameStartResponse.data) {
          console.log("Error on WSS_FROM_ANY__GAME_START__REQUEST")
          return;
        }
        const { game: startGame, gameUser: gameUserStart } = gameUserGameStartResponse.data!;
        const clientWsGameStartResponse = await WebSocketManager.getClientsWsByGame(manager, startGame.token);
        if (clientWsGameStartResponse.data!.clientsWs.length === 0) {
          console.log("No clientWs found")
        }
        const { clientsWs: clientWsGameStart } = clientWsGameStartResponse.data!;

        console.log(startGame.token)
        const deckUsers = await GameRoundsManager.prepareNextRound(startGame.token);
        for (const clientWs of clientWsGameStart) {
          const userDeck = deckUsers.find(d => d.gameUser.userId === clientWs.user.id);
          if (!userDeck) {
            continue;
          }
          const data = {
            deck: userDeck.deckCards
          };
          // const finalData = {
          //   requestId: Utils.uniqueId(24),
          //   opCode: WebSocketOpCodeClient.WSS_TO_ANY__GAME_START__REQUEST,
          //   packet: data,
          //   token: Utils.buildHmacSha256Signature(data),
          //   hasFinalResponse: true
          // };
          // clientWs.send(JSON.stringify(finalData));
        }
        break;
      case WebSocketOpCodeServer.WSS_FROM_ANY__JOIN_TEAM__REQUEST:
        messageTyped = message as WebSocketClientSecuredMessage<WsPacketJoinTeamRequest>;
        const { gameToken, teamId, position } = messageTyped.packet.data;
        const gameResponse = await GamesManager.findByToken(gameToken);
        if (!gameResponse.data && !gameResponse.success) {
          return WebSocketManager.sendMessageToClient(
            manager,
            clientWs,
            message.requestId,
            WebSocketOpCodeClient.WSS_TO_ANY__JOIN_TEAM__RESPONSE,
            {
              success: false,
              data: {
                codeError: WebSocketCodeError.GAME_NOT_EXIST
              }
            },
            true
          );
        }
        const { game } = gameResponse.data!;
        const tmpGameUserResponse = await GameUsersManager.findByUserId(clientWs.user!.id, "NOT_FINISHED");
        if (!tmpGameUserResponse.success && !tmpGameUserResponse.data) {
          return WebSocketManager.sendMessageToClient(
            manager,
            clientWs,
            message.requestId,
            WebSocketOpCodeClient.WSS_TO_ANY__JOIN_TEAM__RESPONSE,
            {
              success: false,
              data: {
                codeError: WebSocketCodeError.USER_ALREADY_IN_TEAM,
                user: clientWs.user.pseudo
              }
            },
            true
          );
        }
        const { gameUser } = tmpGameUserResponse.data!;
        gameUser.position = position;
        gameUser.joiningGameDate = moment();
        gameUser.teamId = teamId;
        await gameUser.save();
        const findUpdatedAvailableTeamPlace = await GameUsersManager.findAvailableTeamPlace(game.id!);

        WebSocketManager.sendMessageToGameUsers(
          manager,
          game.token,
          message.requestId,
          WebSocketOpCodeClient.WSS_TO_ANY__JOIN_TEAM__RESPONSE,
          {
            success: true,
            data: {
              game: game.toJSON(),
              availableTeamPlaces: findUpdatedAvailableTeamPlace.data!.availableTeamPlaces,
              gameUser: gameUser.toJSON()
            }
          },
          true
        );

        const checkGameIsFullPlayersResponse = await GameUsersManager.checkGameIsFullPlayers(game.id!);
        const { nbrUsers } = checkGameIsFullPlayersResponse.data!;
        const usersGameResponse = await GameUsersManager.findUsersByGameToken(game.token);
        const { gameUsers:gameUsersJoinTeam } = usersGameResponse.data!;
        const hasEmptyTeam = gameUsersJoinTeam.find(u => u.teamId === null);
        if (nbrUsers >= GamesManager.MAX_USERS_PER_GAME && !game.isFull && !hasEmptyTeam) {
          game.startDate = moment();
          game.isFull = true;
          await game.save();

          WebSocketManager.sendMessageToGameUsers(
            manager,
            game.token,
            message.requestId,
            WebSocketOpCodeClient.WSS_TO_ANY__GAME_START__REQUEST,
            {
              success: true,
              data: {
                isStarting: true
              }
            },
            true
          );
        }
        break;
      case WebSocketOpCodeServer.WSS_FROM__ALL_NEW_MESSAGE__REQUEST:
        messageTyped = message as WebSocketClientSecuredMessage<WsPacketAddMessageRequest>;
        const {msg, gameToken:msgToken } = messageTyped.packet.data;
        const gameAllMessageResponse = await GamesManager.findByToken(msgToken);
        if (!gameAllMessageResponse.success && !gameAllMessageResponse.data) {
          console.log("game not found for sneding message")
        }
        const { game: gameAllNewMessage } = gameAllMessageResponse.data!;
        const msgAll = new GameMessageEntity(null, msg, clientWs.user.id, gameAllNewMessage.id!, moment(), true);
        await msgAll.save();
        return WebSocketManager.sendMessageToGameUsers(
          manager,
          gameAllNewMessage.token,
          message.requestId,
          WebSocketOpCodeClient.WSS_TO_ANY__ALL_NEW_MESSAGE__RESPONSE,
          {
            success: true,
            data: {
              msg,
              pseudo: clientWs.user!.pseudo
            }
          },
          true
        )
        break;
      case WebSocketOpCodeServer.WSS_FROM__TEAM_NEW_MESSAGE__REQUEST:
        messageTyped = message as WebSocketClientSecuredMessage<WsPacketAddMessageRequest>;
        const {msg: msgTeam, gameToken:msgTokenTeam } = messageTyped.packet.data;
        const gameTeamMessageResponse = await GamesManager.findByToken(msgTokenTeam);
        const gameUserNewMessageResponse = await GameUsersManager.findUsersByGameToken(msgTokenTeam);
        if (!gameUserNewMessageResponse.success && !gameUserNewMessageResponse.data) {
          console.log("game user not found for sneding message")
        }
        const { gameUsers: gameUsersNewMessages } = gameUserNewMessageResponse.data!;
        let gameUserNewMessage = null;
        for (const g of gameUsersNewMessages) {
          if (clientWs.user.id === g.userId) {
            gameUserNewMessage = g;
          }
        }
        if (!gameTeamMessageResponse.success && !gameTeamMessageResponse.data) {
          console.log("game not found for sneding message")
        }
        const { game: gameTeamNewMessage } = gameTeamMessageResponse.data!;
        console.log(null, msgTeam, clientWs.user.id, gameTeamNewMessage.id!, moment(), true)
        const msgTeamEntity = new GameMessageEntity(null, msgTeam, clientWs.user.id, gameTeamNewMessage.id!, moment(), true);
        await msgTeamEntity.save();
        return WebSocketManager.sendMessageToTeamUsers(
          manager,
          gameTeamNewMessage.token,
          gameUserNewMessage!.teamId!,
          message.requestId,
          WebSocketOpCodeClient.WSS_TO_ANY__ALL_NEW_MESSAGE__RESPONSE,
          {
            success: true,
            data: {
              msg: msgTeam,
              pseudo: clientWs.user!.pseudo
            }
          },
          true
        )
        break;
      case WebSocketOpCodeServer.WSS_FROM_ANY__PONG__REQUEST:
        clientWs.state = WebSocketState.CONNECTED;
        console.log(`client ${clientWs.user.pseudo} is CONNECTED`)
        break;
      // @ts-ignore
      case "test":
        console.log("CHUIS TROP CHAUD")
        break;
      default:
        console.log("OPCODE NOT DEFINED");
        console.log(clientWs.wsKey);
        WebSocketManager.sendMessageToClient(
          manager,
          clientWs,
          message.requestId,
          WebSocketOpCodeClient.WSS_TO_ANY__INVALID_OP_CODE__RESPONSE,
          {
            success: false,
            data: message
          },
          true
        );
    }

    if (
      message.hasFinalResponse &&
      manager.waitingRequests[message.requestId]
    ) {
      delete manager.waitingRequests[message.requestId];
    }
  }

  static onClose(
    message: any,
    clientWs: WebsocketClient,
    manager: WebSocketManager
  ) {
    console.log("CONNEXION CLOSED");
    console.log(clientWs.role);
    console.log(message);
    Object.keys(manager.waitingRequests).forEach(value => {
      const object = manager.waitingRequests[value];
      if (object.id !== clientWs.id) {
        delete manager.waitingRequests[value];
      }
    });
  }

  static onError(
    message: any,
    clientWs: WebsocketClient,
    manager: WebSocketManager
  ) {
    console.error(message);
  }

  static onPong(
    message: any,
    clientWs: WebsocketClient,
    manager: WebSocketManager
  ) {
    const serviceKey = clientWs.role === WebSocketRole.REST_SERVICE ? clientWs.wsKey : clientWs.user.pseudo;
    console.log(`Receive pong from ${serviceKey}`);
    clientWs.state = WebSocketState.CONNECTED;
  }
}
