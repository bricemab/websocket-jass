import {ApplicationResponsePromise, DataBaseGameRound} from "../../utils/Types";
import Utils from "../../utils/Utils";
import {GeneralErrors} from "../../Global/BackendErrors";
import GameRoundEntity from "./GameRoundEntity";
import GameUsersManager from "../GameUsers/GameUsersManager";
import GamesManager from "../Games/GamesManager";
import DeckCardsManager, {UserDeckType} from "../DeckCards/DeckCardsManager";
import DeckCardEntity from "../DeckCards/DeckCardEntity";
import {first} from "lodash";

export default class GameRoundsManager {
  public static async findByGameRound(
    token: string,
    round: number
  ): ApplicationResponsePromise<{ gameRound: GameRoundEntity }> {
    const gameRound = Utils.castMysqlRecordToObject<DataBaseGameRound>(
      await Utils.getMysqlPool().execute(
        "SELECT * FROM `game_rounds` WHERE `token` = :token AND `round` = :round",
        { token, round }
      )
    );

    if (gameRound) {
      return {
        success: true,
        data: {
          gameRound: GameRoundEntity.fromDatabaseObject(gameRound)
        }
      }
    }
    return {
      success: false,
      error: {
        code: GeneralErrors.OBJECT_NOT_FOUND_IN_DATABASE,
        message: "This game_rounds can't be found in database",
        details: {
          token
        }
      }
    };
  }
  public static async findLastRoundByGame(
    id: number,
  ): ApplicationResponsePromise<{ gameRound: GameRoundEntity }> {
    const gameRound = Utils.castMysqlRecordToObject<DataBaseGameRound>(
      await Utils.getMysqlPool().execute(
        "SELECT * FROM `game_rounds` WHERE `game_id` = :id ORDER BY round DESC LIMIT 1",
        { id }
      )
    );

    if (gameRound) {
      return {
        success: true,
        data: {
          gameRound: GameRoundEntity.fromDatabaseObject(gameRound)
        }
      }
    }
    return {
      success: false,
      error: {
        code: GeneralErrors.OBJECT_NOT_FOUND_IN_DATABASE,
        message: "This game_rounds can't be found in database",
        details: {
          id
        }
      }
    };
  }

  public static async prepareNextRound(
    gameToken: string
  ): Promise<UserDeckType[]> {
    let currentGameRound;
    const gameResponse = await GamesManager.findByToken(gameToken);
    const { game } = gameResponse.data!;
    const gameUsersResponse = await GameUsersManager.findUsersByGameToken(gameToken);
    const { gameUsers } = gameUsersResponse.data!;
    const currentGameRoundResponse = await GameRoundsManager.findLastRoundByGame(game.id!);
    if (!currentGameRoundResponse.success && !currentGameRoundResponse.data) {
      //first round of the game
      const firstTrumpUser = gameUsers[Utils.random(0, gameUsers.length-1)];
      const gameRound = new GameRoundEntity(null, game.id!, 1, firstTrumpUser.userId!, null, null, false);
      await gameRound.save();
      currentGameRound = gameRound;
      const deckUsersResponse = await DeckCardsManager.shuffleCardsAndCreateGameDeck(game.token);
      const sevenDiamondResponse = await DeckCardsManager.findCardByKeyGameRound("", currentGameRound.id!);
      if (sevenDiamondResponse.success && sevenDiamondResponse.data) {
        currentGameRound.trumpUserId = sevenDiamondResponse.data.deckCard.userId;
        await currentGameRound.save();
      }
      return deckUsersResponse;
    } else {
      const { gameRound: lastGameRound } = currentGameRoundResponse.data!;
      //second or more round of the game
      if (lastGameRound.isFinished) {
        //if round finish => load new round
        const lastTrumpUser = gameUsers.find(g => g.userId === lastGameRound.trumpUserId);
        if (!lastTrumpUser) {
          console.log("lastTrumpUser not found");
          return [];
        }
        let nextPosition = lastTrumpUser.position! + 1 > 4 ? 1 : lastTrumpUser.position! + 1;
        const nextTrumpUser = gameUsers.find(g => g.position === nextPosition);
        if (!nextTrumpUser) {
          console.log("No nextTrumpUser for next round");
          return [];
        }
        const gameRound = new GameRoundEntity(null, game.id!, lastGameRound.round+1, nextTrumpUser.id!, null, null, false);
        await gameRound.save();
        currentGameRound = gameRound;
        return await DeckCardsManager.shuffleCardsAndCreateGameDeck(game.token);
      } else {
        //if round not finish => load current round + deck
        const userDecks:UserDeckType[] = [];
        for (const user of gameUsers) {
          const userDeckResponse = await DeckCardsManager.getByUserRound(user.id!, lastGameRound.id!);
          if (userDeckResponse.success && userDeckResponse.data) {
            userDecks.push({
              gameUser: user,
              deckCards: userDeckResponse.data.deckCards
            })
          }
        }
        return userDecks;
      }
    }
  }
}
